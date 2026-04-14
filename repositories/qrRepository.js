const { QR, ScanHistory } = require('../models/QR');

exports.isShortIdExists = async (shortId) => {
    return await QR.exists({ shortId, isDeleted: { $in: [true, false] } });
};

// tenantId param kept for API compat but no longer used to filter
exports.findQRsByTenant = (tenantId, filter = {}, sortOpt = { createdAt: -1 }) => {
    return QR.find(filter).sort(sortOpt).lean();
};

// tenantId param kept for API compat but ownership is no longer checked
exports.findQRByIdAndTenant = (id, tenantId) => {
    return QR.findOne({ _id: id }).lean();
};

exports.insertManyQRs = (records) => {
    records.forEach(r => {
        if (r.owner && !r.tenantId) r.tenantId = r.owner;
    });
    return QR.insertMany(records);
};

exports.updateQRByIdAndTenant = async (id, tenantId, updates, adminId) => {
    // tenantId ownership check removed — all admins can edit any QR
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

exports.softDeleteQR = async (id, tenantId) => {
    // tenantId ownership check removed — all admins can delete any QR
    const qr = await QR.findOne({ _id: id });
    if (!qr) throw new Error('QR not found');

    return qr.softDelete();
};