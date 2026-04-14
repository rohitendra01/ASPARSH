const ReviewLink = require('../models/ReviewLink');

// tenantId param kept for API compat but no longer used to filter
exports.listReviewsByTenant = (tenantId, profileId = null) => {
    const query = {};
    if (profileId) query.profileId = profileId;

    return ReviewLink.find(query).sort({ createdAt: -1 }).lean();
};

// tenantId param kept for API compat but ownership is no longer checked
exports.findReviewByIdAndTenant = (id, tenantId) => {
    return ReviewLink.findOne({ _id: id }).lean();
};

exports.findPublicReviewBySlug = (slug) => {
    return ReviewLink.findOne({ slug, status: 'active' }).lean();
};

exports.checkSlugExists = (slug) => {
    return ReviewLink.exists({ slug, isDeleted: { $in: [true, false] } });
};

exports.createReviewLink = (data) => {
    if (data.createdBy && !data.tenantId) data.tenantId = data.createdBy;
    return new ReviewLink(data).save();
};

exports.updateReviewLink = async (id, tenantId, updates, adminId) => {
    // tenantId ownership check removed — all admins can edit any review link
    const reviewLink = await ReviewLink.findOne({ _id: id });
    if (!reviewLink) throw new Error('Review link not found');

    Object.assign(reviewLink, updates);
    reviewLink._modifiedByAdminId = adminId;

    return reviewLink.save();
};

exports.incrementViewCount = (id) => {
    return ReviewLink.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
};

exports.incrementGenerationCount = (slug) => {
    return ReviewLink.findOneAndUpdate(
        { slug, status: 'active' },
        { $inc: { generationCount: 1 } },
        { new: true }
    ).lean();
};

exports.incrementSubmissionCount = (slug) => {
    return ReviewLink.findOneAndUpdate({ slug }, { $inc: { submissionCount: 1 } });
};

exports.saveGeneratedReview = (id, text, category) => {
    return ReviewLink.findByIdAndUpdate(id, {
        $push: {
            generatedReviews: { text, category, generatedAt: new Date() }
        },
        $slice: { generatedReviews: -15 }
    });
};

exports.softDeleteReviewLink = async (id, tenantId) => {
    // tenantId ownership check removed — all admins can delete any review link
    const reviewLink = await ReviewLink.findOne({ _id: id });
    if (!reviewLink) throw new Error('Review link not found');

    return reviewLink.softDelete();
};