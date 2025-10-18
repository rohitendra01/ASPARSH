const mongoose = require('mongoose');
const Design = require('../models/Design');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });


const designs = [
  {
    name: 'Basic Portfolio',
    slug: 'basic',
    templatePath: 'basic-portfolios/show.ejs',
    previewImage: '/images/designs/basic-preview.png',
    description: 'Clean and minimal portfolio design'
  },
  {
    name: 'Modern Portfolio',
    slug: 'modern',
    templatePath: 'custom-portfolios/modern.ejs',
    previewImage: '/images/designs/modern-preview.png',
    description: 'Contemporary design with animations'
  },
  {
    name: 'Creative Portfolio',
    slug: 'creative',
    templatePath: 'custom-portfolios/creative.ejs',
    previewImage: '/images/designs/creative-preview.png',
    description: 'Bold and artistic layout'
  }
];

async function seedDesigns() {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

    await Design.deleteMany({});
    const inserted = await Design.insertMany(designs);
    console.log(`Inserted ${inserted.length} designs`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err && err.message ? err.message : err);
    console.error(err);
    process.exit(1);
  }
}

seedDesigns();
