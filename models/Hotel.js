// models/Hotel.js
const mongoose = require('mongoose');

// Add Cloudinary image URLs to schema instead of storing images in MongoDB
const hotelSchema = new mongoose.Schema({
    hotelId: { 
        type: String, required: true, unique: true 
    },
    hotelName: { 
        type: String, required: true 
    },
    hotelDescription: { 
        type: String, required: true 
    },
    hotelType: { 
        type: String, required: true 
    },
    hotelLogo: {
        type: String, required: true // Store Cloudinary URL
    },
    hotelOfferBanner: {
        type: String,
        required: true // Store Cloudinary URL
    },
            foodCategories: [{
                categoryName: { type: String, required: true },
                foodItems: [{
                    itemName: { type: String, required: true },
                    price: { type: Number }
                }],
                imageUrl: { type: String }
            }],
            hotelAddress: {
                street: { type: String, required: true },
                city: { type: String, required: true },
                state: { type: String, required: true },
                country: { type: String, required: true },
                zipCode: { type: String, required: true }
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
            },
            createdByUsername: {
                type: String, required: true
            },
            createdAt: { 
                type: Date, default: Date.now
            },
            updatedAt: { 
                type: Date, default: Date.now
            },
    // Add username or email option
    createdByUsernameOrEmail: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
