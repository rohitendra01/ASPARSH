const mongoose = require('mongoose');
const { Schema } = mongoose;

const profileSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    mobile: {
        type: String,
        required: true
    },

    image: {
        type: String,
        default: 'https://placehold.co/160x160'
    },

    occupation: {
        type: String,
        trim: true,
        default: ''
    },

    category: {
        type: String,
        trim: true,
        default: ''
    },

    subcategory: {
        type: String,
        trim: true,
        default: ''
    },

    experience: {
        type: Number,
        default: 0
    },

    address: {
        type: new Schema({
            addressLine: { type: String, default: '' },
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            country: { type: String, default: '' },
            postcode: { type: String, default: '' }
        }, { _id: false })
    },

    socialLinks: [{
            platform: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }, { _id: false }
    ],

    slug: {
        type: String,
        unique: true,
        required: true
    },
    hotels: [{
        type: Schema.Types.ObjectId,
        ref: 'Hotel'
    }],
    metadata: {
        type: Schema.Types.Mixed
    }
}, 
{
    timestamps: true
});


profileSchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;