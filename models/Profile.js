const mongoose = require('mongoose');
const { Schema } = mongoose;

const profileSchema = new Schema({
    createdBy: {
        type: String,
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

    address: {
        type: new Schema({
            addressLine: { type: String },
            city: { type: String },
            state: { type: String },
            country: { type: String },
            postcode: { type: String }
        }, { _id: false })
    },


    socialLinks: [
        {
            type: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],

    slug: {
        type: String,
        unique: true
    }
    
}, 

{
    timestamps: true
});


const Profile = mongoose.model('Profile', profileSchema);



module.exports = Profile;