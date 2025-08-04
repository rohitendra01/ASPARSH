const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userSlug: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
