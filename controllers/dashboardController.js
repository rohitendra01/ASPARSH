const { QR, ScanHistory } = require('../models/QR');
const ReviewLink = require('../models/ReviewLink');
const Profile = require('../models/Profile');
const { Portfolio } = require('../models/Portfolio');
const Hotel = require('../models/Hotel');
const VisitingCard = require('../models/VisitingCard');
const Newsletter = require('../models/Newsletter');

exports.getDashboardStats = async (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user._id) {
            return res.redirect('/login');
        }

        const userId = req.user._id;

        // 1. We need the User's QR IDs for ScanHistory lookups
        const userQRs = await QR.find({ owner: userId }).select('_id');
        const userQRIds = userQRs.map(qr => qr._id);

        // Setup Date for 7-day trend analysis
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 30 Days from now for expiring links
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        // 2. Run all major queries concurrently for maximum speed
        const [
            qrAggregation,
            reviewAggregation,
            scanTrendAggregation,
            totalProfiles,
            totalPortfolios,
            totalHotels,
            totalVisitingCards,
            totalSubscribers,
            emptyQRs,
            expiringQRs,
            recentScans
        ] = await Promise.all([

            // --- A. QR Status & Total Scans ---
            QR.aggregate([
                { $match: { owner: userId } },
                {
                    $group: {
                        _id: null,
                        totalScans: { $sum: "$scanCount" },
                        liveCount: { $sum: { $cond: [{ $eq: ["$status", "LIVE"] }, 1, 0] } },
                        emptyCount: { $sum: { $cond: [{ $eq: ["$status", "EMPTY"] }, 1, 0] } },
                        inactiveCount: { $sum: { $cond: [{ $eq: ["$status", "INACTIVE"] }, 1, 0] } }
                    }
                }
            ]),

            // --- B. Review Funnel Stats ---
            ReviewLink.aggregate([
                { $match: { createdBy: userId } },
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: "$viewCount" },
                        totalGenerations: { $sum: "$generationCount" },
                        totalSubmissions: { $sum: "$submissionCount" }
                    }
                }
            ]),

            // --- C. Scan Velocity (Last 7 Days) ---
            ScanHistory.aggregate([
                { $match: { qr: { $in: userQRIds }, scannedAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]),

            // --- D. Active Asset Counts ---
            Profile.countDocuments({ createdBy: userId }),
            Portfolio.countDocuments({ createdBy: userId }),
            Hotel.countDocuments({ createdByAdmin: userId }),
            VisitingCard.countDocuments({ user: userId }),
            Newsletter.countDocuments({ isActive: true }),

            // --- E. Actionable Items ---
            // 5 Empty QRs ready to be assigned
            QR.find({ owner: userId, status: 'EMPTY' })
                .select('shortId batchName createdAt')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),

            // Expiring QRs in the next 30 days
            QR.find({
                owner: userId,
                status: 'LIVE',
                expiresAt: { $gte: new Date(), $lte: thirtyDaysFromNow }
            })
                .select('shortId destinationUrl expiresAt')
                .sort({ expiresAt: 1 })
                .limit(5)
                .lean(),

            // --- F. Recent Activity Feed ---
            ScanHistory.find({ qr: { $in: userQRIds } })
                .sort({ scannedAt: -1 })
                .limit(6)
                .populate('qr', 'shortId destinationUrl status')
                .lean()
        ]);

        // 3. Format & Clean Up Aggregation Results (Handle cases where no data exists yet)
        const qrStats = qrAggregation[0] || { totalScans: 0, liveCount: 0, emptyCount: 0, inactiveCount: 0 };
        const reviewStats = reviewAggregation[0] || { totalViews: 0, totalGenerations: 0, totalSubmissions: 0 };

        // Ensure all 7 days are present in the chart data even if scan count was 0
        const formattedChartData = { labels: [], data: [] };
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const foundRecord = scanTrendAggregation.find(record => record._id === dateStr);
            formattedChartData.labels.push(d.toLocaleDateString('en-US', { weekday: 'short' })); // "Mon", "Tue"
            formattedChartData.data.push(foundRecord ? foundRecord.count : 0);
        }

        // 4. Construct Final Dashboard State Object
        const dashboardData = {
            kpis: {
                totalScans: qrStats.totalScans,
                activeAssets: totalProfiles + totalPortfolios + totalHotels + totalVisitingCards,
                newsletterSubscribers: totalSubscribers,
                reviewConversion: reviewStats.totalSubmissions
            },
            funnels: {
                reviews: {
                    views: reviewStats.totalViews,
                    generations: reviewStats.totalGenerations,
                    submissions: reviewStats.totalSubmissions
                },
                qrLifecycle: {
                    live: qrStats.liveCount,
                    empty: qrStats.emptyCount,
                    inactive: qrStats.inactiveCount
                }
            },
            charts: {
                scanVelocity: formattedChartData
            },
            actionItems: {
                emptyQRs,
                expiringQRs
            },
            recentActivity: {
                scans: recentScans
            }
        };

        // 5. Render the Dashboard View
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