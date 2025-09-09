const mongoose = require('mongoose');

const visitingCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileSlug: { type: String, required: true, lowercase: true, trim: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  website: { type: String },
  createdByAdminUsername: { type: String, required: true, immutable: true, index: true, select: false },
  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true, immutable: true, index: true }
}, { timestamps: true });

visitingCardSchema.index({ profileSlug: 1, user: 1 }, { unique: true });

visitingCardSchema.pre('save', function(next) {
  if (this.profileSlug && typeof this.profileSlug === 'string') {
    this.profileSlug = this.profileSlug.trim().toLowerCase();
  }
  next();
});

module.exports = mongoose.model('VisitingCard', visitingCardSchema);
