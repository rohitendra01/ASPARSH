const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const profileVersionSchema = new mongoose.Schema({
  modifiedAt: { type: Date, default: Date.now },
  modifiedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  snapshot: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const profileSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, index: true },
  slug: { type: String, unique: true, index: true },
  email: { type: String, trim: true, lowercase: true },
  mobile: { type: String, trim: true },
  image: { type: String, default: '' },

  occupation: { type: String, default: '' },
  companyName: { type: String, default: '', index: true },
  bio: { type: String, default: '' },
  website: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  category: { type: String, default: '', index: true },
  subcategory: { type: String, default: '' },
  experience: { type: Number, default: 0 },

  address: {
    addressLine: { type: String, default: '' },
    city: { type: String, default: '', index: true },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    postcode: { type: String, default: '' }
  },
  socialLinks: [{
    platform: String,
    url: String
  }],

  portfolio: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' }],

  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },

  status: {
    type: String,
    enum: ['draft', 'published', 'private', 'archived'],
    default: 'published',
    index: true
  },
  versions: [profileVersionSchema],

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

profileSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

profileSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = this.name ? this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'profile';
    let slug = baseSlug;
    let count = 0;

    while (await mongoose.models.Profile.findOne({ slug, _id: { $ne: this._id } }).select('_id')) {
      count++;
      slug = `${baseSlug}-${nanoid(6)}`;
    }
    this.slug = slug;
  }
  next();
});

profileSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified()) {
    const snapshot = this.toObject();
    delete snapshot.versions;

    this.versions.push({
      modifiedAt: new Date(),
      modifiedByAdmin: this._modifiedByAdminId || this.createdByAdmin,
      snapshot: snapshot
    });

    if (this.versions.length > 15) {
      this.versions = this.versions.slice(-15);
    }
  }
  next();
});

profileSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = 'archived'; // Take offline instantly
  return this.save();
};

module.exports = mongoose.model('Profile', profileSchema);