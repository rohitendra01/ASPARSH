const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email address is required'],
        trim: true,
        lowercase: true,
        unique: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address'],
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'subscribed', 'unsubscribed', 'bounced', 'complained'],
        default: 'subscribed',
        index: true
    },
    verificationToken: {
        type: String,
        index: true
    },
    optInDetails: {
        ipAddress: { type: String, default: 'unknown' },
        userAgent: { type: String, default: 'unknown' },
        browserFingerprint: { type: String, default: 'unknown', index: true },
        timestamp: { type: Date, default: Date.now }
    },
    optOutDetails: {
        ipAddress: { type: String, default: null },
        timestamp: { type: Date, default: null },
        reason: { type: String, default: null }
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

newsletterSchema.pre(/^find/, function (next) {
    if (this.getFilter().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
    next();
});

newsletterSchema.statics.isAlreadySubscribed = async function (email, browserFingerprint) {
    return this.findOne({
        $or: [
            { email: email.toLowerCase() },
            { 'optInDetails.browserFingerprint': browserFingerprint }
        ],
        status: 'subscribed'
    }).select('_id');
};

newsletterSchema.methods.unsubscribe = async function (ipAddress = 'unknown', reason = 'User requested') {
    this.status = 'unsubscribed';
    this.optOutDetails = {
        ipAddress,
        timestamp: new Date(),
        reason
    };
    return this.save();
};

newsletterSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (this.status === 'subscribed') {
        this.status = 'unsubscribed';
    }
    return this.save();
};

module.exports = mongoose.model('Newsletter', newsletterSchema);