const qrService = require('../services/qrService');

exports.index = async (req, res) => {
    try {
        const { status, sort } = req.query;
        // All admins see all QR codes — no tenant isolation
        const qrCodes = await qrService.listAllQRs(status, sort);

        res.render('qr-codes/index', {
            layout: 'layouts/dashboard-boilerplate',
            qrCodes,
            currentStatus: status || 'ALL',
            currentSort: sort || 'newest',
            user: req.user
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not load QR codes');
        res.redirect(`/dashboard/${req.user.slug}`);
    }
};

exports.bulkGenerate = async (req, res) => {
    try {
        // Pass admin ID for the createdByAdmin audit field
        const result = await qrService.generateBulkQRs(req.user._id, req.body.count, req.body.batchName);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const baseUrl = `https://${req.get('host')}`;
        const data = await qrService.getQRDetails(req.params.id, baseUrl);
        res.json({ success: true, ...data });
    } catch (err) {
        console.error(err);
        res.status(err.message === 'QR not found' ? 404 : 500).json({ success: false, message: err.message });
    }
};

exports.updateOne = async (req, res) => {
    try {
        // Pass admin ID so it's stored in the QR version history
        const qr = await qrService.updateQR(req.params.id, req.user._id, req.body);
        res.json({ success: true, qr });
    } catch (err) {
        console.error(err);
        res.status(err.message === 'QR not found' ? 404 : 500).json({ success: false, message: err.message });
    }
};

exports.deleteOne = async (req, res) => {
    try {
        await qrService.deleteQR(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.redirect = async (req, res) => {
    try {
        const userAgent = req.headers['user-agent'] || '';
        const ip = req.ip || req.connection?.remoteAddress || '';

        const result = await qrService.processPublicRedirect(req.params.shortId, userAgent, ip);

        switch (result.state) {
            case 'REDIRECT':
                return res.redirect(result.url);
            case 'EXPIRED':
                return res.render('qr-status/expired', { layout: 'layouts/boilerplate' });
            case 'INACTIVE':
                return res.render('qr-status/inactive', { layout: 'layouts/boilerplate' });
            case 'EMPTY':
                return res.render('qr-status/empty', { layout: 'layouts/boilerplate' });
            case 'NOT_FOUND':
            default:
                return res.status(404).render('qr-status/not-found', { layout: 'layouts/boilerplate' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).render('qr-status/not-found', { layout: 'layouts/boilerplate' });
    }
};