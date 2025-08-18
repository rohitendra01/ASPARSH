// models/portfolio.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectSchema = new Schema({
  title: String,
  description: String,
  link: String,
  images: [String]
}, { _id: false });

const ServiceSchema = new Schema({
  name: String,
  price: Number,
  description: String
}, { _id: false });

const PortfolioSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  slug: { type: String, required: true }, // Add slug for routing
  title: { type: String, default: '' },
  tagline: { type: String, default: '' },
  about: { type: String, default: '' },
  social: {
    website: String,
    linkedin: String,
    instagram: String,
    facebook: String,
    x: String,
    youtube: String
  },
  projects: [ProjectSchema],
  services: [ServiceSchema],
  isPublished: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // optional
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  meta: Schema.Types.Mixed
});

PortfolioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
