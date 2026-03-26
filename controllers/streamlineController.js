const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const Design = require('../models/Design');
const { QR } = require('../models/QR');
const { Portfolio } = require('../models/Portfolio');

exports.renderDashboard = async (req, res) => {
    try {
        const profiles = await Profile.find({}).select('name slug image').lean();
        const designs = await Design.find({ isActive: true }).lean();
        const unassignedQrs = await QR.find({ status: 'EMPTY' }).select('shortId').lean();

        res.render('streamline/dashboard', {
            title: 'Streamline Process Dashboard',
            profiles,
            designs,
            unassignedQrs,
            user: req.user,
            layout: 'layouts/dashboard-boilerplate'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading streamline dashboard');
    }
};

exports.quickCreate = async (req, res) => {
    // This will be a specialized version or wrapper around createPortfolio
    // for AJAX-based fast creation
    try {
        const { profileId, designId, qrSlug } = req.body;
        
        // Basic validation
        if (!profileId || !designId) {
            return res.status(400).json({ success: false, message: 'Profile and Design are required' });
        }

        // Delegate to portfolioController's logic or implement a simplified version here
        // For consistency, let's trigger the existing createPortfolio logic but with specific flags
        req.body.profileId = profileId;
        req.body.designId = designId;
        req.body.qrSlug = qrSlug;

        const portfolioController = require('./portfolioController');
        return portfolioController.createPortfolio(req, res);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
