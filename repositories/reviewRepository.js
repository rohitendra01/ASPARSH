const ReviewLink = require('../models/ReviewLink');

/**
 * List all review links, optionally filtered by profileId.
 * All admins can see all review links — no tenant isolation.
 */
exports.listAllReviews = (profileId = null) => {
    const query = {};
    if (profileId) query.profileId = profileId;

    return ReviewLink.find(query).sort({ createdAt: -1 }).lean();
};

exports.findReviewById = (id) => {
    return ReviewLink.findOne({ _id: id }).lean();
};

exports.findPublicReviewBySlug = (slug) => {
    return ReviewLink.findOne({ slug, status: 'active' }).lean();
};

exports.checkSlugExists = (slug) => {
    return ReviewLink.exists({ slug, isDeleted: { $in: [true, false] } });
};

exports.createReviewLink = (data) => {
    return new ReviewLink(data).save();
};

exports.updateReviewLink = async (id, updates, adminId) => {
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

exports.softDeleteReviewLink = async (id) => {
    const reviewLink = await ReviewLink.findOne({ _id: id });
    if (!reviewLink) throw new Error('Review link not found');

    return reviewLink.softDelete();
};