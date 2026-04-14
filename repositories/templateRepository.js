const VisitingCardTemplate = require('../models/VisitingCardTemplate');

exports.createTemplate = async (templateData) => {
    return await new VisitingCardTemplate(templateData).save();
};

exports.findTemplateByFileName = async (fileName) => {
    return await VisitingCardTemplate.findOne({ fileName }).lean();
};

exports.findAllActiveTemplates = async () => {
    return await VisitingCardTemplate.find({ isActive: true }).sort({ createdAt: -1 }).lean();
};

exports.findAllTemplates = async () => {
    return await VisitingCardTemplate.find().sort({ createdAt: -1 }).lean();
};

exports.findTemplateById = async (id) => {
    return await VisitingCardTemplate.findById(id).lean();
};

exports.updateTemplateById = async (id, updateData) => {
    return await VisitingCardTemplate.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

exports.deleteTemplateById = async (id) => {
    return await VisitingCardTemplate.findByIdAndDelete(id);
};