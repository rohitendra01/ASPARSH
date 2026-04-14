const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const portfolioVersionSchema = new mongoose.Schema({
  modifiedAt: { type: Date, default: Date.now },
  modifiedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  snapshot: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  profession: { type: String, default: 'Professional' },
  briefIntro: { type: String, default: '' },
  aboutDescription: { type: String, default: '' },

  heroImage: { type: String, default: 'https://placehold.co/160x160' },
  aboutImage: { type: String, default: 'https://placehold.co/600x400' },
  galleryImages: [{ type: String }],

  socialLinks: [{
    platform: String,
    url: String
  }],
  workExperience: [{
    title: String,
    company: String,
    duration: String,
    description: String
  }],
  experience: [{
    year: String,
    title: String,
    description: String
  }],

  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
  design: { type: mongoose.Schema.Types.ObjectId, ref: 'Design', required: true },
  qrCode: { type: mongoose.Schema.Types.ObjectId, ref: 'QR' },

  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
    index: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'private', 'archived'],
    default: 'published',
    index: true
  },

  versions: [portfolioVersionSchema],

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

portfolioSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

portfolioSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = this.name ? this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'portfolio';
    let slug = baseSlug;
    let count = 0;

    while (await mongoose.models.Portfolio.findOne({ slug, _id: { $ne: this._id } }).select('_id')) {
      count++;
      slug = `${baseSlug}-${nanoid(6)}`;
    }
    this.slug = slug;
  }
  next();
});

portfolioSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified()) {
    const snapshot = this.toObject();
    delete snapshot.versions;

    this.versions.push({
      modifiedAt: new Date(),
      modifiedByAdmin: this._modifiedByAdminId || this.tenantId,
      snapshot: snapshot
    });

    if (this.versions.length > 20) {
      this.versions = this.versions.slice(-20);
    }
  }
  next();
});

portfolioSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = 'archived';
  return this.save();
};

module.exports = { Portfolio: mongoose.model('Portfolio', portfolioSchema) };