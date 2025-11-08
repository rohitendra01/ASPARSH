const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto');

const addressSchema = new Schema({
  addressLine: { type: String, default: '' },
  city:        { type: String, default: '' },
  state:       { type: String, default: '' },
  country:     { type: String, default: '' },
  postcode:    { type: String, default: '' }
}, { _id: false });

const socialLinkSchema = new Schema({
  platform: { type: String, required: true },
  url:      { type: String, required: true }
}, { _id: false });

const profileSchema = new Schema({
  createdBy: {
    type:     Schema.Types.ObjectId,
    ref:      'AdminUser',
    required: true
  },

  name: {
    type:     String,
    required: true,
    trim:     true
  },

  slug: {
    type:     String,
    unique:   true,
    required: true
  },

  email: {
    type:     String,
    required: true,
    unique:   true,
    lowercase:true
  },

  mobile: {
    type:     String,
    required: true
  },

  image: {
    type:    String,
    default: 'https://placehold.co/160x160'
  },

  occupation: {
    type:    String,
    trim:    true,
    default: ''
  },

  category: {
    type:    String,
    trim:    true,
    default: ''
  },

  subcategory: {
    type:    String,
    trim:    true,
    default: ''
  },

  address: {
    type: addressSchema,
    default: () => ({})
  },

  socialLinks: {
    type: [socialLinkSchema],
    default: []
  },

  hotels: [{
    type: Schema.Types.ObjectId,
    ref:  'Hotel'
  }],

  visitingCard: [{
    type: Schema.Types.ObjectId,
    ref:  'VisitingCard'
  }],

  portfolio: [{
    type: Schema.Types.ObjectId,
    ref:  'Portfolio'
  }],

  reviewLinks: [{
    type: Schema.Types.ObjectId,
    ref:  'ReviewLink'
  }],

  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

profileSchema.pre('validate', function(next) {
  if (!this.slug || this.isModified('name')) {
    const base = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    let uniqueId;
    if (this._id) {
      // For existing documents
      const idSource = `${this._id.toString()}-${Date.now()}`;
      uniqueId = crypto.createHash('md5')
        .update(idSource)
        .digest('hex')
        .substring(0, 10);
    } else {
      // For new documents
      uniqueId = crypto.randomBytes(5).toString('hex');
    }

    this.slug = base ? `${base}-${uniqueId}` : uniqueId;
  }
  next();
});

module.exports = mongoose.model('Profile', profileSchema);
