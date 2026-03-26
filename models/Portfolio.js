const mongoose = require('mongoose');
const { Schema } = mongoose;

const SkillSchema = new Schema({
  iconClass: {
    type:     String,
    required: true,
    trim:     true
  },
  name: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true
  },
  description: {
    type:      String,
    required:  true,
    trim:      true,
    maxlength: 200
  }
}, {
  _id:        true,
  versionKey: false,
  timestamps: true
});

const Skill = mongoose.model('Skill', SkillSchema);


const PORTFOLIO_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'UI/UX Design',
  'Digital Marketing',
  'Content Creation',
  'Photography',
  'Videography',
  'Graphic Design',
  'Writing & Editing',
  'Consulting',
  'Project Management',
  'Other'
];



const WorkExperienceSchema = new Schema({
  category: {
    type:     String,
    required: true,
    enum:     PORTFOLIO_CATEGORIES,
    index:    true
  },
  title: {
    type:     String,
    required: true,
    trim:     true
  },
  description: {
    type:      String,
    required:  true,
    trim:      true,
    maxlength: 200
  },
  detailsUrl: {
    type:     String,
    required: true,
    trim:     true
  }
}, {
  _id:        true,
  versionKey: false
});

const WorkExperience = mongoose.model('WorkExperience', WorkExperienceSchema);


const ExperienceSchema = new Schema({
  dateRange: {
    type:      String,
    required:  true,
    trim:      true,
    maxlength: 50
  },
  roleTitle: {
    type:     String,
    required: true,
    trim:     true
  },
  organization: {
    type:     String,
    required: true,
    trim:     true
  },
  description: {
    type:      String,
    required:  true,
    trim:      true,
    maxlength: 500
  }
}, {
  _id:        true,
  versionKey: false
});

const Experience = mongoose.model('Experience', ExperienceSchema);


const PortfolioSchema = new Schema({
  profileId: { 
    type:     Schema.Types.ObjectId,
    ref:      'Profile',
    required: true,
  },
  slug: { 
    type:     String,
    required: true,
    unique:   true,
    trim:     true
  },
  name: {
    type:     String,
    required: true,
    trim:     true
  },
  profession: {
    type:     String,
    required: true,
    default:  'Nice Person',
    trim:     true
  },
  briefIntro: {
    type:     String,
    required: true,
    default:  'This is a brief introduction about me.',
    trim:     true,
    maxlength: 300
  },
  heroImage: {
    type:     String,
    default:  'https://placehold.co/160x160',
    trim:     true
  },
  socialLinks: [{
    platform: {
      type:     String,
      required: true,
      trim:     true
    },
    url: {
      type:     String,
      required: true,
      trim:     true
    }
  }],
  aboutImage: {
    type:     String,
    default:  'https://placehold.co/600x400',
    trim:     true
  },
  aboutDescription: {
    type:      String,
    default:   'This is a detailed description about me.',
    trim:      true,
    maxlength: 1000
  },
  galleryImages: {
    type:    [String],
    default: []
  },
  skills: [{
    type:     Schema.Types.ObjectId,
    ref:      'Skill',
    required: true
  }],
  workExperience: {
    type:    [WorkExperienceSchema],
    default: []
  },
  experience: {
    type:    [ExperienceSchema],
    default: []
  },
  design: {
    type: Schema.Types.ObjectId,
    ref: 'Design',
    required: true
  },
  qrCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QR'
  },
  createdBy:{
    type:     Schema.Types.ObjectId,
    ref:      'adminUser',
    required: true
  }
}, {
  timestamps: true
});

PortfolioSchema.index({ profileId: 1 });

const Portfolio = mongoose.model('Portfolio', PortfolioSchema);


module.exports = {
  Skill,
  WorkExperience,
  Experience,
  Portfolio,
  PORTFOLIO_CATEGORIES
};
