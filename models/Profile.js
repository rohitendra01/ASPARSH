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
        unique: true
    },

    image: {
        type: String,
        default: ''
    },

    mobile: {
        type: String,
        required: true
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
        // years of experience
        type: Number,
        default: 0
    },

    address: {
        type: new Schema({
            addressLine: { type: String },
            city: { type: String },
            state: { type: String },
            country: { type: String },
            postcode: { type: String }
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
        unique: true
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


const Profile = mongoose.model('Profile', profileSchema);



module.exports = Profile;