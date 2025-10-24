const mongoose = require('mongoose');
const Design = require('../models/Design');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });


const designs = [
  {
    name: 'Basic Portfolio',
    category: 'basic',
    slug: 'basic',
    templatePath: 'portfolios/basic-portfolios/show',
    previewImage: '/images/designs/basic-preview.png',
    description: 'Clean and minimal portfolio design',
    isActive: true
  },
  {
    name: 'Advocate Portfolio',
    category: 'custom',
    slug: 'advocate',
    templatePath: 'portfolios/custom-portfolios/advocate',
    previewImage: '/images/designs/advocate-preview.png',
    description: 'Contemporary design with animations',
    isActive: true
  },
  {
    name: 'Professor Portfolio',
    category: 'custom',
    slug: 'professor',
    templatePath: 'portfolios/custom-portfolios/professor',
    previewImage: '/images/designs/professor-preview.png',
    description: 'Bold and artistic layout',
    isActive: true
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
