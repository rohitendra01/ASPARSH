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

/**
 * List all QR codes with optional status and sort filters.
 * All admins can see all QR codes — no tenant isolation.
 */
exports.listAllQRs = async (statusFilter = 'ALL', sortOption = 'newest') => {
    const filter = {};
    if (statusFilter !== 'ALL') filter.status = statusFilter;

    let sortOpt = { createdAt: -1 };
    if (sortOption === 'oldest') sortOpt = { createdAt: 1 };
    else if (sortOption === 'most_scanned') sortOpt = { scanCount: -1 };

    return await qrRepository.findAllQRs(filter, sortOpt);
};

/**
 * Bulk-generate empty QRs.
 * createdByAdmin is the logged-in admin's ID (audit only).
 */
exports.generateBulkQRs = async (adminUserId, countParam, batchNameParam) => {
    if (!adminUserId) throw new Error('Admin user ID required');

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
            createdByAdmin: adminUserId, // audit only
            batchName,
            status: 'EMPTY'
        });
    }

    await qrRepository.insertManyQRs(qrRecords);
    return { count, batchName };
};

/**
 * Get details of a single QR code.
 * All admins can view any QR.
 */
exports.getQRDetails = async (id, baseUrl) => {
    const qr = await qrRepository.findQRById(id);
    if (!qr) throw new Error('QR not found');

    const qrUrl = `${baseUrl}/qr/${qr.shortId}`;
    const scanHistory = await qrRepository.findRecentScanHistory(id, 50);

    return { qr, qrUrl, scanHistory };
};

/**
 * Update a QR code.
 * adminUserId is stored in the version history.
 */
exports.updateQR = async (id, adminUserId, updates) => {
    const allowedUpdates = {};
    if (updates.destinationUrl !== undefined) {
        allowedUpdates.destinationUrl = updates.destinationUrl;
        allowedUpdates.status = updates.destinationUrl ? 'LIVE' : 'EMPTY';
    }
    if (updates.status !== undefined) allowedUpdates.status = updates.status;
    if (updates.batchName !== undefined) allowedUpdates.batchName = updates.batchName;
    if (updates.profileId !== undefined) allowedUpdates.profileId = updates.profileId;
    if (updates.linkedServiceType !== undefined) allowedUpdates.linkedServiceType = updates.linkedServiceType;
    if (updates.linkedServiceId !== undefined) allowedUpdates.linkedServiceId = updates.linkedServiceId;

    const qr = await qrRepository.updateQRById(id, allowedUpdates, adminUserId);
    if (!qr) throw new Error('QR not found');

    return qr;
};

/**
 * Soft-delete a QR code.
 * All admins can delete any QR.
 */
exports.deleteQR = async (id) => {
    await qrRepository.softDeleteQR(id);
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