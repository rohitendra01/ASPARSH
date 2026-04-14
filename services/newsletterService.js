const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const newsletterRepository = require('../repositories/newsletterRepository');
const emailService = require('./emailService');

exports.processSubscription = async (email, ipAddress, userAgent, browserFingerprint) => {
    const existingSubscription = await newsletterRepository.checkExistingSubscription(email, browserFingerprint);
    if (existingSubscription) {
        return { alreadySubscribed: true };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await newsletterRepository.createSubscription({ email, ipAddress, userAgent, browserFingerprint, verificationToken });

    Promise.allSettled([
        emailService.sendAdminNotification(email, ipAddress, userAgent),
        emailService.sendWelcomeEmail(email, verificationToken)
    ]).catch(err => console.error('Failed to send background emails:', err));

    const token = jwt.sign(
        { subscribed: true, email, fingerprint: browserFingerprint },
        process.env.JWT_SECRET,
        { expiresIn: '365d' }
    );

    return { alreadySubscribed: false, token };
};

exports.verifySubscriptionStatus = async (token, currentFingerprint) => {
    if (!token) return { subscribed: false, email: null };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.fingerprint !== currentFingerprint) {
            return { subscribed: false, email: null };
        }

        const subscription = await newsletterRepository.findActiveSubscription(decoded.email, currentFingerprint);
        return { subscribed: !!subscription, email: subscription ? subscription.email : null };
    } catch (error) {
        return { subscribed: false, email: null };
    }
};

exports.processUnsubscribe = async (token) => {
    const result = await newsletterRepository.findAndDeactivateByToken(token);
    if (!result) throw new Error('Invalid unsubscribe link');
    return true;
};