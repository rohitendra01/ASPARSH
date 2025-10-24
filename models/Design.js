// models/Design.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const designSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['basic', 'custom', 'modern', 'minimal'],
    default: 'basic',
    required: true
  },
  previewImage: {
    type: String,
    default: 'https://placehold.co/400x300'
  },
  templatePath: {
    type: String,
    required: true,
    trim: true
    // e.g., 'portfolio/basic.ejs' or 'portfolio/modern.ejs'
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

designSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Design', designSchema);
