const streamlineService = require('../services/streamlineService');

exports.renderDashboard = async (req, res) => {
    try {
        const dashboardData = await streamlineService.getStreamlineDashboardData();

        res.render('streamline/dashboard', {
            title: 'Streamline Process Dashboard',
            ...dashboardData,
            user: req.user,
            layout: 'layouts/dashboard-boilerplate'
        });
    } catch (err) {
        console.error('Error loading streamline dashboard:', err);
        res.status(500).send('Error loading streamline dashboard');
    }
};

exports.quickCreate = async (req, res) => {
    try {
        const { portfolio, dynamicLinkDoc } = await streamlineService.processQuickCreate(
            req.body,
            req.files,
            req.user?._id
        );

        if (dynamicLinkDoc) {
            dynamicLinkDoc.destinationUrl = `${req.protocol}://${req.get('host')}${dynamicLinkDoc.destinationUrl}`;
            await dynamicLinkDoc.save();
        }

        return res.json({
            success: true,
            portfolio,
            slug: portfolio.slug,
            message: 'Portfolio created successfully via Streamline'
        });

    } catch (err) {
        console.error('Quick Create Error:', err);
        const statusCode = err.message.includes('required') ? 400 : 500;
        res.status(statusCode).json({ success: false, message: err.message });
    }
};