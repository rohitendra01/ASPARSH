const mongoose = require('mongoose');
const { Schema } = mongoose;

const TechnologySchema = new Schema({
  name: { type: String },
  proficiency: { type: Number, min: 0, max: 100 },
  icon: String
}, { _id: false });

const ProjectSchema = new Schema({
  title: { type: String },
  description: { type: String },
  shortDescription: String,
  link: String,
  githubLink: String,
  images: [String],
  technologies: [TechnologySchema],
  category: { type: String },
  featured: { type: Boolean, default: false },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['completed', 'in-progress', 'planned'],
    default: 'completed'
  },
  testimonials: [{
    name: { type: String },
    position: String,
    company: String,
    text: String,
    rating: { type: Number, min: 1, max: 5 },
    image: String,
    date: { type: Date, default: Date.now }
  }]
}, { _id: false });

const ServiceSchema = new Schema({
  name: { type: String },
  price: { type: Number },
  description: { type: String },
  features: [String]
}, { _id: false });

const SkillCategorySchema = new Schema({
  category: { type: String },
  technologies: [TechnologySchema]
}, { _id: false });

const GalleryItemSchema = new Schema({
  title: String,
  description: String,
  imageUrl: { type: String },
  category: String
}, { _id: false });

const PortfolioSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  slug: { type: String, required: true, unique: true },
  title: { type: String },
  tagline: { type: String },
  about: { type: String },

  // Visual/theme and hero settings for the portfolio page
  theme: {
    primary: { type: String, default: '#007bff' },
    secondary: { type: String, default: '#6c757d' },
    background: { type: String, default: '#ffffff' },
    text: { type: String, default: '#212529' },
    font: { type: String, default: 'Montserrat' }
  },

  hero: {
    backgroundType: { type: String, enum: ['color', 'image', 'gradient'], default: 'color' },
    backgroundValue: String,
    layout: { type: String, enum: ['left', 'right', 'center'], default: 'left' }
  },
  social: {
    website: String,
    linkedin: String,
    github: String,
    instagram: String,
    facebook: String,
    x: String,
    youtube: String,
    behance: String,
    dribbble: String
  },

  contact: {
    email: { type: String },
    phone: String,
    address: String,
    showContactForm: { type: Boolean, default: true },
    preferredMethod: { type: String, enum: ['email', 'phone', 'form'], default: 'email' }
  },

  // Sections toggles
  sections: {
    hero: { type: Boolean, default: true },
    about: { type: Boolean, default: true },
    skills: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    services: { type: Boolean, default: true },
    testimonials: { type: Boolean, default: true },
    contact: { type: Boolean, default: true }
  },

  // Portfolio content
  projects: [ProjectSchema],
  services: [ServiceSchema],
  skills: [SkillCategorySchema],
  gallery: [GalleryItemSchema],

  resume: {
    url: String,
    lastUpdated: Date
  },

  seo: {
    title: String,
    description: String,
    keywords: [String],
    ogImage: String
  },

  availability: {
    status: { type: String, enum: ['available', 'not_available', 'limited'], default: 'available' },
    hours: { type: String },
    timeZone: { type: String }
  },

  rates: {
    hourly: { type: Number },
    daily: { type: Number },
    currency: { type: String, default: 'USD' }
  },

  contactPreferences: {
    preferredMethod: { type: String, enum: ['email', 'phone', 'form'] },
    availableHours: { type: String },
    responseTime: { type: String }
  },

  analytics: {
    enabled: { type: Boolean, default: false },
    googleAnalyticsId: String
  },

  isPublished: { type: Boolean, default: false },
  visibility: { type: String, enum: ['public', 'private', 'password'], default: 'public' },
  password: String,

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  meta: Schema.Types.Mixed
}, { timestamps: true });

// Indexes
PortfolioSchema.index({ slug: 1 }, { unique: true });
PortfolioSchema.index({ profileId: 1 });
PortfolioSchema.index({ isPublished: 1 });

// Pre-save: ensure slug exists and updatedAt set (timestamps option handles updatedAt, but keep slug generator)
PortfolioSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);