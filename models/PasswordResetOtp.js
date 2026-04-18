const mongoose = require('mongoose');

const passwordResetOtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true
    },
    otpHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    },
    verifiedAt: {
        type: Date,
        default: null
    },
    usedAt: {
        type: Date,
        default: null
    },
    attemptCount: {
        type: Number,
        default: 0
    },
    requestCount: {
        type: Number,
        default: 1
    },
    lastSentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);
