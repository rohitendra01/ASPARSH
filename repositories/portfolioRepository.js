const { Portfolio } = require('../models/Portfolio');

// tenantId param kept for API compat but no longer used to filter
exports.findPortfoliosByTenant = (tenantId, profileId = null) => {
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

// tenantId param kept for API compat but ownership is no longer checked
exports.findPortfolioByIdAndTenant = (id, tenantId) => {
    return Portfolio.findOne({ _id: id })
        .populate('design')
        .populate('skills');
};

exports.createPortfolio = (data) => {
    if (data.createdBy && !data.tenantId) {
        data.tenantId = data.createdBy;
    }
    return new Portfolio(data).save();
};

exports.updatePortfolio = async (id, tenantId, updates, adminId) => {
    // tenantId ownership check removed — all admins can edit any portfolio
    const portfolio = await Portfolio.findOne({ _id: id });
    if (!portfolio) throw new Error('Portfolio not found');

    Object.assign(portfolio, updates);
    portfolio._modifiedByAdminId = adminId;

    return portfolio.save();
};

exports.softDeletePortfolio = async (id, tenantId) => {
    // tenantId ownership check removed — all admins can delete any portfolio
    const portfolio = await Portfolio.findOne({ _id: id });
    if (!portfolio) throw new Error('Portfolio not found');

    return portfolio.softDelete();
};

exports.searchProfilesByKeyword = (searchQuery, limit = 10) => {
    return Profile.find({
        status: 'published',
        isDeleted: false,
        $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { slug: { $regex: searchQuery, $options: 'i' } }
        ]
    }).limit(limit).select('_id name slug image category').lean();
};