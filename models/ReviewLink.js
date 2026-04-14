const mongoose = require('mongoose');

const generatedReviewSchema = new mongoose.Schema({
  text: String,
  category: String,
  generatedAt: { type: Date, default: Date.now }
}, { _id: false });

const reviewLinkVersionSchema = new mongoose.Schema({
  modifiedAt: { type: Date, default: Date.now },
  modifiedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  targetUrl: { type: String },
  businessName: { type: String },
  status: { type: String }
}, { _id: false });

const reviewLinkSchema = new mongoose.Schema({
  slug: { type: String, unique: true, index: true },
  targetUrl: { type: String, required: [true, 'Target URL is required'], trim: true },
  businessName: { type: String, required: true, trim: true },
  businessSubheader: { type: String, default: '', trim: true },
  businessCategory: { type: String, required: true, trim: true },
  reviewTitle: { type: String, default: 'Share Your Experience' },
  customPromptTemplate: { type: String, default: '' },

  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
    index: true
  },
  profileSlug: { type: String, required: true },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  },

  viewCount: { type: Number, default: 0 },
  generationCount: { type: Number, default: 0 },
  submissionCount: { type: Number, default: 0 },
  generatedReviews: [generatedReviewSchema],

  versions: [reviewLinkVersionSchema],

  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});
reviewLinkSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

reviewLinkSchema.pre('save', function (next) {
  if (!this.isNew && (this.isModified('targetUrl') || this.isModified('businessName') || this.isModified('status'))) {
    this.versions.push({
      modifiedAt: new Date(),
      modifiedByAdmin: this._modifiedByAdminId || this.tenantId,
      targetUrl: this.targetUrl,
      businessName: this.businessName,
      status: this.status
    });

    if (this.versions.length > 10) {
      this.versions = this.versions.slice(-10);
    }
  }
  next();
});

reviewLinkSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = 'archived';
  return this.save();
};

module.exports = mongoose.model('ReviewLink', reviewLinkSchema);