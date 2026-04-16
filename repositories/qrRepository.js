const { QR, ScanHistory } = require('../models/QR');

exports.isShortIdExists = async (shortId) => {
    return await QR.exists({ shortId, isDeleted: { $in: [true, false] } });
};

/**
 * List all QR codes, optionally filtered.
 * All admins can see all QR codes — no tenant isolation.
 */
exports.findAllQRs = (filter = {}, sortOpt = { createdAt: -1 }) => {
    return QR.find(filter).sort(sortOpt).lean();
};

exports.findQRById = (id) => {
    return QR.findOne({ _id: id }).lean();
};

/**
 * Bulk insert pre-built QR records.
 * Records must already have createdByAdmin set by the caller.
 */
exports.insertManyQRs = (records) => {
    return QR.insertMany(records);
};

exports.updateQRById = async (id, updates, adminId) => {
    const qr = await QR.findOne({ _id: id });
    if (!qr) return null;

    Object.assign(qr, updates);
    qr._modifiedByAdminId = adminId;

    return qr.save();
};

exports.findQRByShortId = (shortId) => {
    return QR.findOne({ shortId });
};

exports.recordScanEvent = async (qrId, userAgent, ip) => {
    await QR.findByIdAndUpdate(qrId, {
        $inc: { scanCount: 1 },
        $set: { lastScannedAt: new Date() }
    });
    return ScanHistory.create({ qr: qrId, userAgent, ip });
};

exports.findRecentScanHistory = (qrId, limit = 50) => {
    return ScanHistory.find({ qr: qrId }).sort({ scannedAt: -1 }).limit(limit).lean();
};

exports.softDeleteQR = async (id) => {
    const qr = await QR.findOne({ _id: id });
    if (!qr) throw new Error('QR not found');

    return qr.softDelete();
};