const mongoose = require('mongoose');

const scanHistorySchema = new mongoose.Schema({
    qr: { type: mongoose.Schema.Types.ObjectId, ref: 'QR', required: true, index: true },
    scannedAt: { type: Date, default: Date.now },
    userAgent: { type: String, default: 'unknown' },
    ip: { type: String, default: 'unknown' }
});

const qrVersionSchema = new mongoose.Schema({
    modifiedAt: { type: Date, default: Date.now },
    modifiedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    destinationUrl: { type: String },
    status: { type: String }
}, { _id: false });

const qrSchema = new mongoose.Schema({
    shortId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    destinationUrl: {
        type: String,
        trim: true,
        default: null
    },
    batchName: {
        type: String,
        default: 'Default',
        index: true
    },

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true,
        index: true
    },

    status: {
        type: String,
        enum: ['EMPTY', 'LIVE', 'INACTIVE'],
        default: 'EMPTY',
        index: true
    },
    expiresAt: {
        type: Date,
        default: null,
        index: true
    },

    scanCount: {
        type: Number,
        default: 0
    },
    lastScannedAt: {
        type: Date,
        default: null
    },

    versions: [qrVersionSchema],

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

qrSchema.pre(/^find/, function (next) {
    if (this.getFilter().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
    next();
});

qrSchema.pre('save', function (next) {
    if (!this.isNew && (this.isModified('destinationUrl') || this.isModified('status'))) {
        this.versions.push({
            modifiedAt: new Date(),
            modifiedByAdmin: this._modifiedByAdminId || this.tenantId,
            destinationUrl: this.destinationUrl,
            status: this.status
        });

        if (this.versions.length > 10) {
            this.versions = this.versions.slice(-10);
        }
    }
    next();
});

qrSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.status = 'INACTIVE';
    return this.save();
};

const QR = mongoose.model('QR', qrSchema);
const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);

module.exports = { QR, ScanHistory };