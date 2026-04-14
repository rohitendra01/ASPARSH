const VisitingCard = require('../models/VisitingCard');

/**
 * Create a new visiting card document.
 */
exports.create = (data) => {
    return new VisitingCard(data).save();
};

/**
 * Find a card by its unique public slug.
 * Populates the template reference.
 */
exports.findBySlug = (slug) => {
    return VisitingCard.findOne({ slug })
        .populate('templateId')
        .lean();
};

/**
 * Find a card by its MongoDB _id.
 * Populates the template reference.
 */
exports.findById = (id) => {
    return VisitingCard.findById(id)
        .populate('templateId')
        .lean();
};

/**
 * Fetch ALL visiting cards company-wide (no owner filter).
 */
exports.findAll = () => {
    return VisitingCard.find({})
        .populate('templateId')
        .sort({ createdAt: -1 })
        .lean();
};

// Kept for backward-compat; now returns all cards regardless of userId
exports.findAllByCreator = () => {
    return exports.findAll();
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
 * Delete a card by its _id.
 */
exports.deleteById = (id) => {
    return VisitingCard.findByIdAndDelete(id);
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