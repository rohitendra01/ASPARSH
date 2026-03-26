const mongoose = require('mongoose');

const scanHistorySchema = new mongoose.Schema({
    qr: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QR',
        required: true,
        index: true
    },
    scannedAt: {
        type: Date,
        default: Date.now
    },
    userAgent: {
        type: String,
        default: ''
    },
    ip: {
        type: String,
        default: ''
    }
}, { _id: true });

const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);

const qrSchema = new mongoose.Schema({
    shortId: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        index: true
    },
    destinationUrl: {
        type: String,
        default: null,
        trim: true
    },
    status: {
        type: String,
        enum: ['EMPTY', 'LIVE', 'INACTIVE'],
        default: 'EMPTY'
    },
    batchName: {
        type: String,
        default: '',
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true
    },
    scanCount: {
        type: Number,
        default: 0
    },
    lastScannedAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const QR = mongoose.model('QR', qrSchema);

module.exports = { QR, ScanHistory };
