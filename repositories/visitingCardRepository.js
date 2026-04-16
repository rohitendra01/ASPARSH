const VisitingCard = require('../models/VisitingCard');

/**
 * Create a new visiting card document.
 */
exports.create = (data) => {
    return new VisitingCard(data).save();
};

/**
 * Find a card by its unique public slug.
 */
exports.findBySlug = (slug) => {
    return VisitingCard.findOne({ slug })
        .populate('templateId')
        .lean();
};

/**
 * Find a card by its MongoDB _id.
 */
exports.findById = (id) => {
    return VisitingCard.findById(id)
        .populate('templateId')
        .lean();
};

/**
 * Fetch ALL visiting cards company-wide.
 * All admins can see all cards — no owner filter.
 */
exports.findAll = () => {
    return VisitingCard.find({})
        .populate('templateId')
        .populate('profileId', 'name slug email mobile')
        .sort({ createdAt: -1 })
        .lean();
};

/**
 * Fetch all visiting cards belonging to a specific profile.
 */
exports.findByProfileId = (profileId) => {
    return VisitingCard.find({ profileId })
        .populate('templateId')
        .sort({ createdAt: -1 })
        .lean();
};

/**
 * Update a card by its _id. Returns the updated document.
 */
exports.updateById = (id, data) => {
    return VisitingCard.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
        returnDocument: 'after'
    })
        .populate('templateId')
        .lean();
};

/**
 * Soft-delete a card by its _id.
 */
exports.softDeleteById = async (id) => {
    const card = await VisitingCard.findById(id);
    if (!card) throw new Error('Visiting card not found');
    card.isDeleted = true;
    card.deletedAt = new Date();
    card.isPublished = false;
    return card.save();
};

/**
 * Atomically increment the viewCount for a card identified by slug.
 */
exports.incrementViewCount = (slug) => {
    return VisitingCard.findOneAndUpdate(
        { slug },
        { $inc: { viewCount: 1 } },
        { new: true }
    );
};