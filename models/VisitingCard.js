const mongoose = require('mongoose');

const visitingCardSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitingCardTemplate', required: true },

  profile: {
    fullName: { type: String, required: true },
    designation: { type: String },
    companyName: { type: String },
    bio: { type: String },
    profileImage: { type: String },
    coverImage: { type: String },
    logoUrl: { type: String },
    customFields: { type: mongoose.Schema.Types.Mixed }
  },

  contact: {
    primaryEmail: { type: String },
    primaryPhone: { type: String },
    website: { type: String },
    location: {
      address: { type: String },
      mapEmbedUrl: { type: String }
    },
    businessHours: { type: String },
    additionalContacts: [{
      platform: { type: String },
      value: { type: String },
      link: { type: String },
      icon: { type: String }
    }]
  },

  socials: [{
    platform: { type: String },
    url: { type: String },
    icon: { type: String }
  }],

  tags: [{ type: String }],

  stats: [{ label: { type: String }, value: { type: String }, icon: { type: String } }],
  heroStats: [{ label: { type: String }, value: { type: String } }],

  services: [{
    title: { type: String }, description: { type: String },
    icon: { type: String }, image: { type: String },
    price: { type: String }, actionLink: { type: String }
  }],

  specializations: [{ title: { type: String }, description: { type: String }, icon: { type: String } }],

  pricingPlans: [{
    planName: { type: String }, price: { type: String }, duration: { type: String },
    features: [{ type: String }], actionLink: { type: String }
  }],

  process: [{
    title: { type: String }, description: { type: String }, icon: { type: String }
  }],

  faqs: [{
    question: { type: String }, answer: { type: String }
  }],

  portfolio: [{
    title: { type: String }, mediaUrl: { type: String }, description: { type: String },
    mediaType: { type: String, enum: ['image', 'video', 'youtube-embed', 'link'] }
  }],

  experience: [{
    title: { type: String }, organization: { type: String },
    duration: { type: String }, description: { type: String }
  }],

  testimonials: [{
    clientName: { type: String }, context: { type: String }, quote: { type: String },
    rating: { type: Number, min: 1, max: 5 }, avatar: { type: String }
  }],

  gallery: [{ image: { type: String }, title: { type: String } }],
  partners: [{ name: { type: String }, logo: { type: String }, websiteUrl: { type: String } }],
  qualifications: [{ type: String }],

  callToAction: {
    title: { type: String },
    description: { type: String },
    buttonText: { type: String },
    buttonLink: { type: String }
  },

  theme: {
    primaryColor: { type: String, default: '#1e40af' },
    secondaryColor: { type: String, default: '#0891b2' },
    fontStyle: { type: String, default: 'Inter' },

    sectionTitles: {
      about: { type: String, default: 'About Me' },
      services: { type: String, default: 'Our Services' },
      specializations: { type: String, default: 'Specializations' },
      pricing: { type: String, default: 'Pricing' },
      process: { type: String, default: 'Process' },
      portfolio: { type: String, default: 'Portfolio' },
      experience: { type: String, default: 'Experience' },
      testimonials: { type: String, default: 'Testimonials' },
      gallery: { type: String, default: 'Gallery' },
      faqs: { type: String, default: 'FAQ' },
      partners: { type: String, default: 'Our Partners' },
      stats: { type: String, default: 'Highlights' },
      contact: { type: String, default: 'Contact Us' }
    },

    sectionDescriptions: {
      about: { type: String },
      services: { type: String },
      specializations: { type: String },
      pricing: { type: String },
      process: { type: String },
      portfolio: { type: String },
      experience: { type: String },
      testimonials: { type: String },
      gallery: { type: String },
      faqs: { type: String },
      partners: { type: String },
      stats: { type: String },
      contact: { type: String }
    }
  },

  slug: { type: String, unique: true, sparse: true },
  viewCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  isPublished: { type: Boolean, default: true }

}, { timestamps: true });

visitingCardSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('VisitingCard', visitingCardSchema);