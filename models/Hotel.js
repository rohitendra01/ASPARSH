// models/hotel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const VersionSchema = new Schema({
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  changedByName: { type: String, required: true }
}, { _id: true });

const hotelSchema = new Schema({
  hotelSlug: { type: String, required: true, unique: true },
  hotelName: { type: String, required: true },
  hotelDescription: { type: String, required: true },
  hotelType: { type: String, required: true },
  hotelLogo: { type: String, required: true },
  hotelOfferBanner: { type: String, required: true },
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

  createdByProfileUsername: { type: String, required: true },
  createdByProfile: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },

  createdByAdminUsername: { type: String, required: true },
  createdByAdmin: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },


  versions: [VersionSchema]

}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
