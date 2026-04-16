const { Portfolio } = require('../models/Portfolio');
const Profile = require('../models/Profile');

/**
 * List all portfolios, optionally filtered by profileId.
 * All admins can see all portfolios — no tenant isolation.
 */
exports.findAllPortfolios = (profileId = null) => {
    const query = {};
    if (profileId) query.profileId = profileId;

    return Portfolio.find(query)
        .populate('profileId', 'name slug image')
        .populate('design', 'name templatePath category thumbnail')
        .sort({ createdAt: -1 })
        .lean();
};

exports.findPublicPortfolioBySlug = (slug) => {
    return Portfolio.findOne({ slug, status: 'published' })
        .populate('skills', 'name iconClass description')
        .populate('design', 'name slug templatePath category')
        .populate('profileId', 'name email mobile image socialLinks address')
        .lean();
};

exports.findPortfolioById = (id) => {
    return Portfolio.findOne({ _id: id })
        .populate('design')
        .populate('skills');
};

exports.createPortfolio = (data) => {
    return new Portfolio(data).save();
};

exports.updatePortfolio = async (id, updates, adminId) => {
    const portfolio = await Portfolio.findOne({ _id: id });
    if (!portfolio) throw new Error('Portfolio not found');

    Object.assign(portfolio, updates);
    portfolio._modifiedByAdminId = adminId;

    return portfolio.save();
};

exports.softDeletePortfolio = async (id) => {
    const portfolio = await Portfolio.findOne({ _id: id });
    if (!portfolio) throw new Error('Portfolio not found');

    return portfolio.softDelete();
};

exports.searchProfilesByKeyword = (searchQuery, limit = 10) => {
    return Profile.find({
        $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { slug: { $regex: searchQuery, $options: 'i' } }
        ]
    }).limit(limit).select('_id name slug image category').lean();
};