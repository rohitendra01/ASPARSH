const mongoose = require('mongoose');
const { Portfolio } = require('../models/Portfolio');
const DynamicLink = require('../models/DynamicLink');
const Profile = require('../models/Profile');
const Design = require('../models/Design');
const adminUser = require('../models/adminUser');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function verifySystem() {
    try {
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri);

        console.log('--- Verification Start ---');

        // 1. Check if Designs are seeded
        const designCount = await Design.countDocuments();
        console.log(`Designs in DB: ${designCount}`);

        // 2. Check if pre-printed QRs are seeded
        const qrCount = await DynamicLink.countDocuments({ isAssigned: false });
        console.log(`Unassigned QRs in DB: ${qrCount}`);

        // 3. Test Portfolio Creation with QR Linking (Simulated)
        const profile = await Profile.findOne({});
        const design = await Design.findOne({});
        const qr = await DynamicLink.findOne({ isAssigned: false });

        if (!profile || !design || !qr) {
            console.log('❌ Could not find necessary data for simulation. Please run seeding scripts first.');
            process.exit(1);
        }

        console.log(`Simulating creation for Profile: ${profile.name}, Design: ${design.name}, QR: ${qr.slug}`);
        
        // This is a direct check of the linking logic
        const portfolio = new Portfolio({
            profileId: profile._id,
            slug: `test-portfolio-${Date.now()}`,
            name: `${profile.name} Test`,
            profession: 'Tester',
            design: design._id,
            dynamicLink: qr._id,
            createdBy: profile.createdBy || profile._id // Fallback
        });

        await portfolio.save();
        
        qr.isAssigned = true;
        qr.portfolioId = portfolio._id;
        qr.destinationUrl = `http://localhost:3000/portfolio/${portfolio.slug}`;
        await qr.save();

        console.log('✅ Portfolio created and QR linked successfully!');
        
        // Clean up test portfolio
        await Portfolio.findByIdAndDelete(portfolio._id);
        qr.isAssigned = false;
        qr.portfolioId = undefined;
        await qr.save();
        console.log('🧹 Cleaned up test data.');

        console.log('--- Verification Complete ---');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Verification failed:', err.message);
        process.exit(1);
    }
}

verifySystem();
