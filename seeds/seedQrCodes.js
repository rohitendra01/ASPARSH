const mongoose = require('mongoose');
const DynamicLink = require('../models/DynamicLink');
const adminUser = require('../models/adminUser');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function seedQrCodes() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI not found in environment');

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

    // Find an admin user to own the links
    const admin = await adminUser.findOne({});
    if (!admin) {
        console.error('❌ No admin user found. Please create an admin user first.');
        process.exit(1);
    }

    const qrCodes = [];
    // Generating 10 pre-printed QR code slugs for testing/initial use
    for (let i = 1; i <= 10; i++) {
        const slug = `QR${String(i).padStart(3, '0')}`;
        qrCodes.push({
            slug,
            destinationUrl: 'https://asparsh.in', // Default placeholder
            name: `Pre-printed QR ${slug}`,
            owner: admin._id,
            isAssigned: false
        });
    }

    for (const qrData of qrCodes) {
        await DynamicLink.findOneAndUpdate(
            { slug: qrData.slug },
            qrData,
            { upsert: true, new: true }
        );
        console.log(`✅ Seeded pre-printed QR: ${qrData.slug}`);
    }

    console.log('✨ QR Code seeding completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seedQrCodes();
