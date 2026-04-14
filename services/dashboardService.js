const dashboardRepository = require('../repositories/dashboardRepository');

exports.generateDashboardMetrics = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const userQRIds = await dashboardRepository.getUserQRIds();

    const [
        qrAggregation,
        reviewAggregation,
        scanTrendAggregation,
        [totalProfiles, totalPortfolios, totalHotels, totalVisitingCards, totalSubscribers],
        [emptyQRs, expiringQRs],
        recentScans
    ] = await Promise.all([
        dashboardRepository.getQRStats(),
        dashboardRepository.getReviewStats(),
        dashboardRepository.getScanVelocity(userQRIds, sevenDaysAgo),
        dashboardRepository.getAssetCounts(),
        dashboardRepository.getActionItems(thirtyDaysFromNow),
        dashboardRepository.getRecentScans(userQRIds)
    ]);

    const qrStats = qrAggregation[0] || { totalScans: 0, liveCount: 0, emptyCount: 0, inactiveCount: 0 };
    const reviewStats = reviewAggregation[0] || { totalViews: 0, totalGenerations: 0, totalSubmissions: 0 };

    const formattedChartData = { labels: [], data: [] };
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const foundRecord = scanTrendAggregation.find(record => record._id === dateStr);
        formattedChartData.labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        formattedChartData.data.push(foundRecord ? foundRecord.count : 0);
    }

    return {
        kpis: {
            totalScans: qrStats.totalScans,
            activeAssets: totalProfiles + totalPortfolios + totalHotels + totalVisitingCards,
            newsletterSubscribers: totalSubscribers,
            reviewConversion: reviewStats.totalSubmissions
        },
        funnels: {
            reviews: { views: reviewStats.totalViews, generations: reviewStats.totalGenerations, submissions: reviewStats.totalSubmissions },
            qrLifecycle: { live: qrStats.liveCount, empty: qrStats.emptyCount, inactive: qrStats.inactiveCount }
        },
        charts: { scanVelocity: formattedChartData },
        actionItems: { emptyQRs, expiringQRs },
        recentActivity: { scans: recentScans }
    };
};