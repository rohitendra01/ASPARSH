const mongoose = require('mongoose');
const validator = require('validator');

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    browserFingerprint: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    source: {
        type: String,
        default: 'footer_form'
    },
    verificationToken: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for performance
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ browserFingerprint: 1 });
newsletterSchema.index({ ipAddress: 1 });

// Method to check if already subscribed
newsletterSchema.statics.isAlreadySubscribed = async function(email, browserFingerprint) {
    const existing = await this.findOne({
        $or: [
            { email: email },
            { browserFingerprint: browserFingerprint }
        ]
    });
    return existing;
};

module.exports = mongoose.model('Newsletter', newsletterSchema);
