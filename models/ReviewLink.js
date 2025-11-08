const mongoose = require('mongoose');

const { Schema } = mongoose;

const reviewLinkSchema = new Schema({
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  
  // NEW: Add profileId reference (like VisitingCard does)
  profileId: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: false
  },
  
  profileSlug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },

  profileDetails: {
    name: String,
    category: String,
    subcategory: String,
    occupation: String
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  reviewTitle: {
    type: String,
    default: 'Share Your Experience'
  },

  customPromptTemplate: {
    type: String,
    default: null
  },

  linkType: {
    type: String,
    enum: ['google_review', 'custom_form'],
    default: 'google_review'
  },

  googleReviewUrl: {
    type: String,
    default: null
  },

  googlePlaceId: {
    type: String,
    default: null
  },

  customFormUrl: {
    type: String,
    default: null
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
    text: String,
    category: String,
    generatedAt: { type: Date, default: Date.now }
  }],

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

reviewLinkSchema.pre('save', async function(next) {
  if (this.isModified('profileSlug') && this.profileSlug) {
    try {
      const Profile = mongoose.model('Profile');
      const profile = await Profile.findOne({ slug: this.profileSlug });
      if (profile) {
        this.profileId = profile._id;  // Store the ObjectId reference
        this.profileDetails = {
          name: profile.name,
          category: profile.category,
          subcategory: profile.subcategory,
          occupation: profile.occupation
        };
      }
    } catch (error) {
      console.error('[ReviewLink] Error fetching profile:', error.message);
    }
  }
  next();
});

reviewLinkSchema.index({ profileSlug: 1, isActive: 1 });
reviewLinkSchema.index({ createdBy: 1 });
reviewLinkSchema.index({ profileId: 1 });  // NEW: Index on profileId

module.exports = mongoose.model('ReviewLink', reviewLinkSchema);