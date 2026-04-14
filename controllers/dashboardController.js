const dashboardService = require('../services/dashboardService');

exports.getDashboardStats = async (req, res) => {
    try {
        const dashboardData = await dashboardService.generateDashboardMetrics();

        res.render('dashboard', {
            layout: 'layouts/dashboard-boilerplate',
            user: req.user,
            slug: req.user.slug,
            stats: dashboardData
        });

    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        req.flash('error_msg', 'Unable to load dashboard statistics.');
        res.render('dashboard', {
            layout: 'layouts/dashboard-boilerplate',
            user: req.user,
            slug: req.user?.slug,
            stats: null,
            error: error.message
        });
    }
};