const mongoose = require('mongoose');

const visitingCardTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    templateKey: {
        type: String,
        required: true,
        unique: true
    },

    // The EJS file name under views/visiting-cards/templates/ (without .ejs)
    fileName: {
        type: String,
        required: true
    },

    thumbnailUrl: {
        type: String
    },

    category: {
        type: String,
        default: 'General'
    },

    defaultColors: {
        primary: { type: String, default: '#1e40af' },
        secondary: { type: String, default: '#0891b2' }
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('VisitingCardTemplate', visitingCardTemplateSchema);