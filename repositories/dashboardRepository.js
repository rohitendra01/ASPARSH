const { QR, ScanHistory } = require('../models/QR');
const ReviewLink = require('../models/ReviewLink');
const Profile = require('../models/Profile');
const { Portfolio } = require('../models/Portfolio');
const Hotel = require('../models/Hotel');
const VisitingCard = require('../models/VisitingCard');
const Newsletter = require('../models/Newsletter');

exports.getUserQRIds = async () => {
    const qrs = await QR.find({ isDeleted: false }).select('_id').lean();
    return qrs.map(qr => qr._id);
};

exports.getQRStats = () => {
    return QR.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: null,
                totalScans: { $sum: "$scanCount" },
                liveCount: { $sum: { $cond: [{ $eq: ["$status", "LIVE"] }, 1, 0] } },
                emptyCount: { $sum: { $cond: [{ $eq: ["$status", "EMPTY"] }, 1, 0] } },
                inactiveCount: { $sum: { $cond: [{ $eq: ["$status", "INACTIVE"] }, 1, 0] } }
            }
        }
    ]);
};

exports.getScanVelocity = (userQRIds, startDate) => {
    return ScanHistory.aggregate([
        { $match: { qr: { $in: userQRIds }, scannedAt: { $gte: startDate } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);
};

exports.getReviewStats = async () => {
    const stats = await ReviewLink.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$viewCount' },
                totalGenerations: { $sum: '$generationCount' },
                totalSubmissions: { $sum: '$submissionCount' }
            }
        }
    ]);
    return stats[0] || { totalViews: 0, totalGenerations: 0, totalSubmissions: 0 };
};

exports.getGlobalStats = async () => {
    const query = { isDeleted: false };

    const [profiles, portfolios, visitingCards, hotels, reviewLinks, qrs] = await Promise.all([
        Profile.countDocuments(query),
        Portfolio.countDocuments(query),
        VisitingCard.countDocuments(query),
        Hotel.countDocuments(query),
        ReviewLink.countDocuments(query),
        QR.countDocuments(query)
    ]);

    return { profiles, portfolios, visitingCards, hotels, reviewLinks, qrs };
};

exports.getAssetCounts = () => {
    const query = { isDeleted: false };
    return Promise.all([
        Profile.countDocuments(query),
        Portfolio.countDocuments(query),
        Hotel.countDocuments(query),
        VisitingCard.countDocuments(query),
        Newsletter.countDocuments({ status: 'subscribed', isDeleted: false }) // Upgraded to Newsletter lifecycle
    ]);
};

exports.getActionItems = (thirtyDaysFromNow) => {
    const query = { isDeleted: false };

    return Promise.all([
        QR.find({ ...query, status: 'EMPTY' }).select('shortId batchName createdAt').sort({ createdAt: -1 }).limit(5).lean(),
        QR.find({ ...query, status: 'LIVE', expiresAt: { $gte: new Date(), $lte: thirtyDaysFromNow } }).select('shortId destinationUrl expiresAt').sort({ expiresAt: 1 }).limit(5).lean()
    ]);
};

exports.getRecentScans = (userQRIds, limit = 10) => {
    const matchQuery = userQRIds && userQRIds.length > 0
        ? { qr: { $in: userQRIds } }
        : {};
    return ScanHistory.find(matchQuery)
        .sort({ scannedAt: -1 })
        .limit(limit)
        .lean();
};