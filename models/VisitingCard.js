const mongoose = require('mongoose');

const visitingCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'adminUser', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitingCardTemplate', required: true },

  // 1. BASIC IDENTITY
  profile: {
    fullName: { type: String, required: true },
    designation: { type: String },
    companyName: { type: String },
    bio: { type: String },
    profileImage: { type: String },
    coverImage: { type: String },
    logo: { type: String }, // Good for Seeds, Bus, Insurance
    customFields: { type: Map, of: String }
  },

  // 2. CONTACT & HOURS (Crucial for Salons, Doctors, Gyms)
  contact: {
    primaryEmail: { type: String },
    primaryPhone: { type: String },
    website: { type: String },
    location: {
      address: { type: String },
      mapEmbedUrl: { type: String }
    },
    businessHours: { type: String }, // e.g., "Mon-Fri: 9AM - 8PM"
    additionalContacts: [{
      platform: { type: String },
      value: { type: String },
      link: { type: String },
      icon: { type: String }
    }]
  },

  // 3. SOCIAL MEDIA
  socials: [{
    platform: { type: String },
    url: { type: String },
    icon: { type: String }
  }],

  // 4. STATS / HIGHLIGHTS (Clients, Cases Won, Surgeries)
  stats: [{
    label: { type: String },
    value: { type: String },
    icon: { type: String }
  }],

  // 5. THE MASTER BUCKET: OFFERINGS 
  // (Handles: Services, Practice Areas, Insurance Plans, Tour Destinations, Bus Routes, Seed Products)
  services: [{
    title: { type: String },
    description: { type: String },
    icon: { type: String },
    image: { type: String }, // Added: Tour & Photographer designs use images here, not icons
    price: { type: String },
    actionLink: { type: String }
  }],

  // 6. PRICING PACKAGES (Handles: Gym Memberships, Photographer Packages, Salon Pricing)
  pricingPlans: [{
    planName: { type: String },
    price: { type: String },
    duration: { type: String }, // e.g., "per month", "per session"
    features: [{ type: String }], // Array of strings for what's included
    actionLink: { type: String }
  }],

  // 7. PORTFOLIO / MEDIA (Handles: YouTube embeds, Photographer Video reels)
  portfolio: [{
    title: { type: String },
    mediaType: { type: String, enum: ['image', 'video', 'youtube-embed', 'link'] },
    mediaUrl: { type: String },
    description: { type: String }
  }],

  // 8. TIMELINE / EXPERIENCE 
  // (Handles: Advocate History, Professor Education, Travel Itineraries)
  experience: [{
    title: { type: String },
    organization: { type: String },
    duration: { type: String },
    description: { type: String }
  }],

  // 9. REVIEWS / TESTIMONIALS
  testimonials: [{
    clientName: { type: String },
    context: { type: String }, // e.g., "Bypass Patient" or "Manali Tour Client"
    quote: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    avatar: { type: String } // Added for nicer UI
  }],

  // 10. GALLERY (Handles: Bus Fleet, Salon Photos, Gym Transformations, Seed Crops)
  gallery: [{
    image: { type: String },
    title: { type: String }
  }],

  // 11. PARTNERS & AFFILIATES 
  // (Handles: Insurance Companies Represented, Seed Distributors, Brands worked with)
  partners: [{
    name: { type: String },
    logo: { type: String },
    websiteUrl: { type: String }
  }],

  // 12. TEXT LISTS 
  // (Handles: Doctor Qualifications, Photographer Equipment, Bus Amenities, Seed Certifications)
  qualifications: [{ type: String }],

  // 13. SPECIALIZATIONS (Secondary Grid - mostly for Doctors/Professors)
  specializations: [{
    title: { type: String },
    description: { type: String },
    icon: { type: String }
  }],

  // 14. THEME & ALIASING (The magic sauce for minimal design changes)
  theme: {
    primaryColor: { type: String, default: '#1e40af' },
    secondaryColor: { type: String, default: '#0891b2' },
    fontStyle: { type: String, default: 'Inter' },

    // THE ALIAS SYSTEM: Let the user rename the sections without changing the database structure
    sectionTitles: {
      services: { type: String, default: 'Our Services' },
      experience: { type: String, default: 'Experience' },
      gallery: { type: String, default: 'Gallery' },
      partners: { type: String, default: 'Our Partners' }
    }
  },

  // 15. SYSTEM FIELDS
  slug: { type: String, unique: true, sparse: true },
  viewCount: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model('VisitingCard', visitingCardSchema);