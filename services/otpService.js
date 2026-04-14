const transporter = require('../mailer');
const userRepository = require('../repositories/userRepository');

const otpStore = {};

const generateOtp = () => (Math.floor(100000 + Math.random() * 900000)).toString();

exports.generateAndSendOtp = async (email) => {
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
        throw new Error('No account with that email.');
    }

    const otp = generateOtp();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };

    await transporter.sendMail({
        to: email,
        subject: 'Your OTP for Password Reset',
        html: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
    });

    return true;
};

exports.resendOtp = async (email) => {
    if (!otpStore[email]) {
        throw new Error('Session expired. Please request again.');
    }

    const otp = generateOtp();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };

    await transporter.sendMail({
        to: email,
        subject: 'Your OTP for Password Reset',
        html: `<p>Your new OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
    });

    return true;
};

exports.verifyOtp = (email, providedOtp) => {
    const record = otpStore[email];
    if (!record || record.expires < Date.now()) {
        throw new Error('OTP expired. Please request again.');
    }
    if (record.otp !== providedOtp) {
        throw new Error('Invalid OTP. Try again.');
    }
    return true;
};

exports.resetPassword = async (email, newPassword) => {
    if (!otpStore[email]) {
        throw new Error('Session expired or OTP not verified.');
    }

    await userRepository.updateUserPassword(email, newPassword);

    delete otpStore[email];
    return true;
};