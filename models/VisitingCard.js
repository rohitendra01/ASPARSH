const mongoose = require('mongoose');

const visitingCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // reference to profile by slug (use slug string instead of ObjectId)
  profileSlug: { type: String, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  website: { type: String },
  createdByAdminUsername: { type: String, required: true },
  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true }
}, { timestamps: true });

module.exports = mongoose.model('VisitingCard', visitingCardSchema);
