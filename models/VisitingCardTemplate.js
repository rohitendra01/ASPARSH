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

    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
        index: true
    },

    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true
    },

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

    customFields: {
        type: mongoose.Schema.Types.Mixed,
        default: []
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