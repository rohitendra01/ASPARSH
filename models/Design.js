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
  previewImage: {
    type: String,
    default: 'https://placehold.co/400x300'
  },
  templatePath: {
    type: String,
    required: true,
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

module.exports = mongoose.model('Design', designSchema);
