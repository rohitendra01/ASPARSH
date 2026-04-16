const mongoose = require('mongoose');

const hotelVersionSchema = new mongoose.Schema({
  modifiedAt: { type: Date, default: Date.now },
  modifiedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  snapshot: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '', index: true },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  amenities: [{ type: String }],

  hotelLogo: { type: String, default: '' },
  hotelOfferBanner: { type: String, default: '' },
  galleryImages: [{ type: String }],

  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    index: true
  },

  versions: [hotelVersionSchema],

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

hotelSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

hotelSchema.pre('save', async function (next) {
  if (this.isModified('name')) {
    let baseSlug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let count = 0;

    while (await mongoose.models.Hotel.findOne({ slug, _id: { $ne: this._id } }).select('_id')) {
      count++;
      slug = `${baseSlug}-${count}`;
    }
    this.slug = slug;
  }
  next();
});

hotelSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified()) {
    const snapshot = this.toObject();
    delete snapshot.versions;

    this.versions.push({
      modifiedAt: new Date(),
      modifiedByAdmin: this._modifiedByAdminId,
      snapshot: snapshot
    });
  }
  next();
});

hotelSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = 'archived';
  return this.save();
};

module.exports = mongoose.model('Hotel', hotelSchema);