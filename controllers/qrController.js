const { QR, ScanHistory } = require('../models/QR');
const QRCode = require('qrcode');

// Generate a unique short ID
const generateShortId = async (length = 7) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await QR.findOne({ shortId: id });
    if (existing) return generateShortId(length);
    return id;
};

// GET /dashboard/:slug/qr-codes  — list all QR codes for this admin
exports.index = async (req, res) => {
    try {
        const { status, sort } = req.query;
        const filter = { owner: req.user._id };
        if (status && ['EMPTY', 'LIVE', 'INACTIVE'].includes(status)) {
            filter.status = status;
        }
        const sortOpt = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
        const qrCodes = await QR.find(filter).sort(sortOpt).lean();
        res.render('qr-codes/index', {
            layout: 'layouts/dashboard-boilerplate',
            qrCodes,
            currentStatus: status || 'ALL',
            currentSort: sort || 'newest',
            user: req.user,
            req
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not load QR codes');
        res.redirect('/dashboard/' + req.user.slug);
    }
};

// POST /dashboard/:slug/qr-codes/bulk-generate
exports.bulkGenerate = async (req, res) => {
    try {
        const { count, batchName } = req.body;
        const num = Math.min(parseInt(count, 10) || 1, 100);
        const batch = (batchName || '').trim() || `Batch-${Date.now()}`;

        const records = [];
        for (let i = 0; i < num; i++) {
            const shortId = await generateShortId();
            records.push({
                shortId,
                batchName: batch,
                owner: req.user._id,
                status: 'EMPTY'
            });
        }
        await QR.insertMany(records);
        res.json({ success: true, count: num, batchName: batch });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /dashboard/:slug/qr-codes/:id — get single QR (JSON for side panel)
exports.getOne = async (req, res) => {
    try {
        const qr = await QR.findOne({ _id: req.params.id, owner: req.user._id }).lean();
        if (!qr) return res.status(404).json({ success: false, message: 'QR not found' });

        // Generate QR image
        const redirectUrl = `https://asparsh.onrender.com/q/${qr.shortId}`;
        const qrCodeImage = await QRCode.toDataURL(redirectUrl, { width: 300, margin: 2 });

        // Get scan history (last 50)
        const history = await ScanHistory.find({ qr: qr._id })
            .sort({ scannedAt: -1 })
            .limit(50)
            .lean();

        res.json({ success: true, qr, qrCodeImage, redirectUrl, history });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /dashboard/:slug/qr-codes/:id/update — update QR settings
exports.updateOne = async (req, res) => {
    try {
        const { destinationUrl, batchName, status, expiresAt } = req.body;
        const updates = {};

        if (destinationUrl !== undefined) updates.destinationUrl = destinationUrl.trim() || null;
        if (batchName !== undefined) updates.batchName = batchName.trim();
        if (['EMPTY', 'LIVE', 'INACTIVE'].includes(status)) updates.status = status;
        if (expiresAt) {
            updates.expiresAt = new Date(expiresAt);
        } else if (expiresAt === '') {
            updates.expiresAt = null;
        }

        const qr = await QR.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            updates,
            { new: true, lean: true }
        );
        if (!qr) return res.status(404).json({ success: false, message: 'QR not found' });

        res.json({ success: true, qr });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /dashboard/:slug/qr-codes/:id/delete — delete a QR
exports.deleteOne = async (req, res) => {
    try {
        await QR.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        await ScanHistory.deleteMany({ qr: req.params.id });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /q/:shortId — public redirect endpoint
exports.redirect = async (req, res) => {
    const { shortId } = req.params;
    try {
        const qr = await QR.findOne({ shortId });

        if (!qr) {
            return res.status(404).render('qr-status/not-found', {
                layout: 'layouts/boilerplate'
            });
        }

        // Asynchronously record scan without blocking redirect
        const recordScan = async () => {
            try {
                qr.scanCount = (qr.scanCount || 0) + 1;
                qr.lastScannedAt = new Date();
                await qr.save();
                await ScanHistory.create({
                    qr: qr._id,
                    userAgent: req.headers['user-agent'] || '',
                    ip: req.ip || req.connection.remoteAddress || ''
                });
            } catch (e) {
                console.error('Scan record error:', e);
            }
        };

        if (qr.status === 'LIVE') {
            // Check expiry
            if (qr.expiresAt && new Date() > new Date(qr.expiresAt)) {
                qr.status = 'INACTIVE';
                await qr.save();
                return res.render('qr-status/expired', { layout: 'layouts/boilerplate' });
            }

            // Valid live QR
            recordScan(); // fire and forget

            let destination = qr.destinationUrl || '';
            if (destination && !/^https?:\/\//i.test(destination)) {
                destination = 'https://' + destination;
            }
            if (!destination) {
                return res.render('qr-status/empty', { layout: 'layouts/boilerplate' });
            }
            return res.redirect(destination);
        }

        if (qr.status === 'INACTIVE') {
            return res.render('qr-status/inactive', { layout: 'layouts/boilerplate' });
        }

        // EMPTY status
        return res.render('qr-status/empty', { layout: 'layouts/boilerplate' });

    } catch (err) {
        console.error(err);
        res.status(500).render('qr-status/not-found', { layout: 'layouts/boilerplate' });
    }
};
