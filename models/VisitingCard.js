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
    customFields: { type: Map, of: String }
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

  stats: [{
    label: { type: String },
    value: { type: String },
    icon: { type: String }
  }],

  heroStats: [{
    label: { type: String },
    value: { type: String }
  }],

  services: [{
    title: { type: String },
    description: { type: String },
    icon: { type: String },
    image: { type: String },
    price: { type: String },
    actionLink: { type: String }
  }],

  pricingPlans: [{
    planName: { type: String },
    price: { type: String },
    duration: { type: String },
    features: [{ type: String }],
    actionLink: { type: String }
  }],

  portfolio: [{
    title: { type: String },
    mediaType: { type: String, enum: ['image', 'video', 'youtube-embed', 'link'] },
    mediaUrl: { type: String },
    description: { type: String }
  }],

  experience: [{
    title: { type: String },
    organization: { type: String },
    duration: { type: String },
    description: { type: String }
  }],

  testimonials: [{
    clientName: { type: String },
    context: { type: String },
    quote: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    avatar: { type: String }
  }],

  gallery: [{
    image: { type: String },
    title: { type: String }
  }],

  partners: [{
    name: { type: String },
    logo: { type: String },
    websiteUrl: { type: String }
  }],

  qualifications: [{ type: String }],

  specializations: [{
    title: { type: String },
    description: { type: String },
    icon: { type: String }
  }],

  theme: {
    primaryColor: { type: String, default: '#1e40af' },
    secondaryColor: { type: String, default: '#0891b2' },
    fontStyle: { type: String, default: 'Inter' },

    sectionTitles: {
      services: { type: String, default: 'Our Services' },
      experience: { type: String, default: 'Experience' },
      gallery: { type: String, default: 'Gallery' },
      partners: { type: String, default: 'Our Partners' },
      stats: { type: String, default: 'Medical Excellence' }
    },

    sectionDescriptions: {
      services: { type: String }
    }
  },

  slug: { type: String, unique: true, sparse: true },
  viewCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  isPublished: { type: Boolean, default: true }

}, { timestamps: true });

// Automatically exclude soft-deleted cards from all find queries
visitingCardSchema.pre(/^find/, function (next) {
    if (this.getFilter().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
    next();
});

module.exports = mongoose.model('VisitingCard', visitingCardSchema);