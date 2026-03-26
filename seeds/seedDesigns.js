const mongoose = require('mongoose');
const Design = require('../models/Design');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function seedDesigns() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI not found in environment');
    
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

    const designsPath = path.join(__dirname, 'designs.json');
    const designs = JSON.parse(fs.readFileSync(designsPath, 'utf8'));

    console.log(`Found ${designs.length} designs in config.`);

    for (const designData of designs) {
      await Design.findOneAndUpdate(
        { slug: designData.slug },
        designData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Seeded/Updated design: ${designData.name} (${designData.slug})`);
    }

    console.log('✨ Design seeding completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seedDesigns();
