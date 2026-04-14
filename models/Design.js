const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Design name is required'],
    trim: true,
    unique: true
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
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['portfolio', 'visiting-card', 'hotel', 'resume'],
    index: true
  },
  templatePath: {
    type: String,
    required: [true, 'Template path is required (e.g., portfolios/designs/modern)']
  },
  thumbnail: {
    type: String,
    default: 'https://placehold.co/400x300?text=No+Preview'
  },
  isPremium: {
    type: Boolean,
    default: false,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    index: true
  },
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

designSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

designSchema.pre('save', async function (next) {
  if (this.isModified('name')) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    let slug = baseSlug;
    let count = 0;

    while (await mongoose.models.Design.findOne({ slug, _id: { $ne: this._id } }).select('_id')) {
      count++;
      slug = `${baseSlug}-${count}`;
    }
    this.slug = slug;
  }
  next();
});

designSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = 'archived';
  return this.save();
};

module.exports = mongoose.model('Design', designSchema);