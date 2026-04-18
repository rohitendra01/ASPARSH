const crypto = require('crypto');
const transporter = require('../mailer');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const userRepository = require('../repositories/userRepository');
const { getRequiredEnv, OTP_LIFETIME_MS, OTP_MAX_ATTEMPTS } = require('../utils/securityConfig');
const { validatePasswordStrength } = require('../utils/securityUtils');

const generateOtp = () => (Math.floor(100000 + Math.random() * 900000)).toString();
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const getOtpHash = (email, otp) => {
    const secret = getRequiredEnv('SESSION_SECRET');
    return crypto
        .createHmac('sha256', secret)
        .update(`${normalizeEmail(email)}:${String(otp || '').trim()}`)
        .digest('hex');
};

async function upsertOtpRecord(email, otp) {
    const normalizedEmail = normalizeEmail(email);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);

    return PasswordResetOtp.findOneAndUpdate(
        { email: normalizedEmail },
        {
            $set: {
                email: normalizedEmail,
                otpHash: getOtpHash(normalizedEmail, otp),
                expiresAt,
                verifiedAt: null,
                usedAt: null,
                attemptCount: 0,
                lastSentAt: now
            },
            $inc: { requestCount: 1 }
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            runValidators: true
        }
    );
}

exports.generateAndSendOtp = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    const user = await userRepository.findUserByEmail(normalizedEmail);
    if (!user) {
        throw new Error('No account with that email.');
    }

    const otp = generateOtp();
    await upsertOtpRecord(normalizedEmail, otp);

    await transporter.sendMail({
        to: normalizedEmail,
        subject: 'Your OTP for Password Reset',
        html: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
    });

    return true;
};

exports.resendOtp = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    const record = await PasswordResetOtp.findOne({ email: normalizedEmail });

    if (!record || record.expiresAt.getTime() < Date.now() || record.usedAt) {
        throw new Error('Session expired. Please request again.');
    }

    const otp = generateOtp();
    await upsertOtpRecord(normalizedEmail, otp);

    await transporter.sendMail({
        to: normalizedEmail,
        subject: 'Your OTP for Password Reset',
        html: `<p>Your new OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
    });

    return true;
};

exports.verifyOtp = async (email, providedOtp) => {
    const normalizedEmail = normalizeEmail(email);
    const record = await PasswordResetOtp.findOne({ email: normalizedEmail });

    if (!record || record.expiresAt.getTime() < Date.now() || record.usedAt) {
        throw new Error('OTP expired. Please request again.');
    }

    if (record.attemptCount >= OTP_MAX_ATTEMPTS) {
        await PasswordResetOtp.deleteOne({ _id: record._id });
        throw new Error('Too many invalid OTP attempts. Please request a new code.');
    }

    if (record.otpHash !== getOtpHash(normalizedEmail, providedOtp)) {
        record.attemptCount += 1;
        await record.save();

        if (record.attemptCount >= OTP_MAX_ATTEMPTS) {
            await PasswordResetOtp.deleteOne({ _id: record._id });
            throw new Error('Too many invalid OTP attempts. Please request a new code.');
        }

        throw new Error('Invalid OTP. Try again.');
    }

    record.verifiedAt = new Date();
    record.attemptCount = 0;
    await record.save();

    return true;
};

exports.resetPassword = async (email, newPassword) => {
    const normalizedEmail = normalizeEmail(email);
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
        throw new Error(passwordError);
    }

    const record = await PasswordResetOtp.findOne({ email: normalizedEmail });
    if (!record || !record.verifiedAt || record.usedAt || record.expiresAt.getTime() < Date.now()) {
        throw new Error('Session expired or OTP not verified.');
    }

    await userRepository.updateUserPassword(normalizedEmail, newPassword);

    record.usedAt = new Date();
    await record.save();
    await PasswordResetOtp.deleteOne({ _id: record._id });
    return true;
};
