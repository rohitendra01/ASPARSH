const crypto = require('crypto');
const qrRepository = require('../repositories/qrRepository');

const generateShortId = async () => {
    let shortId;
    let isUnique = false;
    while (!isUnique) {
        shortId = crypto.randomBytes(4).toString('hex');
        const exists = await qrRepository.isShortIdExists(shortId);
        if (!exists) isUnique = true;
    }
    return shortId;
};

exports.listUserQRs = async (tenantId, statusFilter = 'ALL', sortOption = 'newest') => {
    const filter = {};
    if (statusFilter !== 'ALL') filter.status = statusFilter;

    let sortOpt = { createdAt: -1 };
    if (sortOption === 'oldest') sortOpt = { createdAt: 1 };
    else if (sortOption === 'most_scanned') sortOpt = { scanCount: -1 };

    return await qrRepository.findQRsByTenant(tenantId, filter, sortOpt);
};

exports.generateBulkQRs = async (tenantId, countParam, batchNameParam) => {
    const count = parseInt(countParam, 10);
    if (isNaN(count) || count < 1 || count > 500) {
        throw new Error('Count must be between 1 and 500.');
    }

    const batchName = batchNameParam ? batchNameParam.trim() : `Batch ${new Date().toLocaleDateString()}`;
    const qrRecords = [];

    for (let i = 0; i < count; i++) {
        const shortId = await generateShortId();
        qrRecords.push({
            shortId,
            tenantId,
            batchName,
            status: 'EMPTY'
        });
    }

    await qrRepository.insertManyQRs(qrRecords);
    return { count, batchName };
};

exports.getQRDetails = async (id, tenantId, baseUrl) => {
    const qr = await qrRepository.findQRByIdAndTenant(id, tenantId);
    if (!qr) throw new Error('QR not found or unauthorized');

    const qrUrl = `${baseUrl}/qr/${qr.shortId}`;
    const scanHistory = await qrRepository.findRecentScanHistory(id, 50);

    return { qr, qrUrl, scanHistory };
};

exports.updateQR = async (id, tenantId, updates) => {
    const allowedUpdates = {};
    if (updates.destinationUrl !== undefined) {
        allowedUpdates.destinationUrl = updates.destinationUrl;
        allowedUpdates.status = updates.destinationUrl ? 'LIVE' : 'EMPTY';
    }
    if (updates.status !== undefined) allowedUpdates.status = updates.status;
    if (updates.batchName !== undefined) allowedUpdates.batchName = updates.batchName;

    const qr = await qrRepository.updateQRByIdAndTenant(id, tenantId, allowedUpdates, tenantId);
    if (!qr) throw new Error('QR not found or unauthorized');

    return qr;
};

exports.deleteQR = async (id, tenantId) => {
    await qrRepository.softDeleteQR(id, tenantId);
    return true;
};

exports.processPublicRedirect = async (shortId, userAgent, ip) => {
    const qr = await qrRepository.findQRByShortId(shortId);

    if (!qr) return { state: 'NOT_FOUND' };
    if (qr.status === 'INACTIVE') return { state: 'INACTIVE' };
    if (qr.status === 'EMPTY' || !qr.destinationUrl) return { state: 'EMPTY' };
    if (qr.expiresAt && new Date() > qr.expiresAt) {
        qr.status = 'INACTIVE';
        await qr.save();
        return { state: 'EXPIRED' };
    }

    qrRepository.recordScanEvent(qr._id, userAgent, ip).catch(err => console.error('Error tracking scan:', err));

    return { state: 'REDIRECT', url: qr.destinationUrl };
};