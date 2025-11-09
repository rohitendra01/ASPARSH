const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewLinkSchema = new Schema({
  profileId: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },

  profileSlug: {
    type: String, 
    required: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true
  },

  businessName: {
    type: String,
    required: true
  },

  businessSubheader: {
    type: String
  },

  businessCategory: {
    type: String,
    required: false
  },

  reviewTitle: {
    type: String,
    default: 'Share Your Experience'
  },

  targetUrl: {
    type: String,
    required: true
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'adminUser',
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  viewCount: {
    type: Number,
    default: 0
  },

  generationCount: {
    type: Number,
    default: 0
  },
  
  submissionCount: {
    type: Number,
    default: 0
  },
  
  generatedReviews: [{
    text: {
      type: String,
      required: true
    },

    category: {
      type: String 
    },

    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  customPromptTemplate: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model('ReviewLink', reviewLinkSchema);