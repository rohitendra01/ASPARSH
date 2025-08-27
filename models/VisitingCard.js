const mongoose = require('mongoose');

const visitingCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // optionally link visiting cards to a Profile (similar to Portfolio)
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  slug: { type: String },
  name: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  website: { type: String },
  linkedin: { type: String },
  twitter: { type: String },
  facebook: { type: String },
  instagram: { type: String },
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('VisitingCard', visitingCardSchema);
