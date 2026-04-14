const Newsletter = require('../models/Newsletter');

exports.checkExistingSubscription = (email, browserFingerprint) => {
    return Newsletter.isAlreadySubscribed(email, browserFingerprint);
};

exports.createSubscription = (data) => {
    const newsletterData = {
        email: data.email,
        verificationToken: data.verificationToken,
        status: 'subscribed',
        optInDetails: {
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            browserFingerprint: data.browserFingerprint,
            timestamp: new Date()
        }
    };
    return new Newsletter(newsletterData).save();
};

exports.findActiveSubscription = (email, browserFingerprint) => {
    return Newsletter.findOne({
        email: email.toLowerCase(),
        'optInDetails.browserFingerprint': browserFingerprint,
        status: 'subscribed'
    }).lean();
};

exports.findAndDeactivateByToken = async (token, ipAddress = 'unknown') => {
    const subscription = await Newsletter.findOne({ verificationToken: token });
    if (!subscription) return null;

    return subscription.unsubscribe(ipAddress, 'Unsubscribed via email link token');
};

exports.softDeleteSubscription = async (id) => {
    const subscription = await Newsletter.findById(id);
    if (!subscription) throw new Error('Subscription not found');
    return subscription.softDelete();
};