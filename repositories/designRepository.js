const Design = require('../models/Design');

exports.findActiveDesigns = (category = null, includePremium = true) => {
    const query = { status: 'published' };

    if (category) query.category = category;

    if (!includePremium) query.isPremium = false;

    return Design.find(query)
        .select('name slug category thumbnail templatePath isPremium')
        .sort({ createdAt: -1 })
        .lean();
};

exports.findDesignById = (id) => {
    return Design.findById(id).lean();
};

exports.findDesignBySlug = (slug) => {
    return Design.findOne({ slug, status: 'published' }).lean();
};

exports.createDesign = (data) => {
    return new Design(data).save();
};

exports.updateDesign = (id, updates) => {
    return Design.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
};

exports.softDeleteDesign = async (id) => {
    const design = await Design.findById(id);
    if (!design) throw new Error('Design not found');
    return design.softDelete();
};