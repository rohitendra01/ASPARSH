const mongoose = require('mongoose');

const dynamicLinkSchema = new mongoose.Schema({
    slug: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    destinationUrl: {
        type: String,
        required: [true, 'Destination URL is required'],
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true
    },
    name: {
        type: String,
        trim: true,
        default: 'Untitled Link'
    },
    clicks: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DynamicLink', dynamicLinkSchema);
