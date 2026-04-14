const validator = require('validator');
const newsletterService = require('../services/newsletterService');
const { generateBrowserFingerprint } = require('../utils/fingerprintUtils');

exports.newsletterSignup = async (req, res) => {
    try {
        const body = req.body || {};
        const email = body.email || (body.get && body.get('email')) || null;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.get ? req.get('User-Agent') : (req.headers && req.headers['user-agent']) || '';
        const browserFingerprint = generateBrowserFingerprint(req);

        const result = await newsletterService.processSubscription(email, ipAddress, userAgent, browserFingerprint);

        if (result.alreadySubscribed) {
            return res.status(200).json({ success: true, message: 'You are already subscribed to our newsletter!', alreadySubscribed: true });
        }

        res.status(201).json({ success: true, message: 'Successfully subscribed to newsletter!', data: { token: result.token } });

    } catch (error) {
        console.error('Newsletter signup error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'This email is already subscribed to our newsletter.' });
        }
        res.status(500).json({ success: false, message: 'Internal server error. Please try again later.' });
    }
};

exports.checkSubscriptionStatus = async (req, res) => {
    try {
        const browserFingerprint = generateBrowserFingerprint(req);
        const status = await newsletterService.verifySubscriptionStatus(req.body.token, browserFingerprint);

        res.status(200).json({ success: true, data: status });
    } catch (error) {
        console.error('Check subscription error:', error);
        res.status(200).json({ success: true, data: { subscribed: false, email: null } });
    }
};

exports.unsubscribe = async (req, res) => {
    try {
        await newsletterService.processUnsubscribe(req.params.token);
        res.status(200).json({ success: true, message: 'Successfully unsubscribed from newsletter' });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        const status = error.message === 'Invalid unsubscribe link' ? 404 : 500;
        res.status(status).json({ success: false, message: error.message || 'Error processing unsubscribe request' });
    }
};