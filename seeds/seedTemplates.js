/**
 * seeds/seedTemplates.js
 *
 * Seed / upsert VisitingCardTemplate documents.
 * Run with: node seeds/seedTemplates.js
 *
 * Each document requires:
 *  - name        : Display name shown in the picker
 *  - templateKey : Unique slug identifier (used as DB key)
 *  - fileName    : EJS file name under views/visiting-cards/templates/ (without .ejs)
 *  - category    : e.g. Medical, Legal, Tech, Business
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const VisitingCardTemplate = require('../models/VisitingCardTemplate');

const templates = [
    {
        name: 'Doctor / Medical Pro',
        templateKey: 'doctor',
        fileName: 'doctor',
        category: 'Medical',
        thumbnailUrl: '',
        defaultColors: { primary: '#1e40af', secondary: '#0891b2' },
        isActive: true
    },
    // Add more templates here as you create their EJS files:
    // {
    //     name: 'Lawyer / Legal Professional',
    //     templateKey: 'lawyer',
    //     fileName: 'lawyer',
    //     category: 'Legal',
    //     thumbnailUrl: '',
    //     defaultColors: { primary: '#7c3aed', secondary: '#a78bfa' },
    //     isActive: true
    // },
    // {
    //     name: 'Tech Startup / Developer',
    //     templateKey: 'tech',
    //     fileName: 'tech',
    //     category: 'Technology',
    //     thumbnailUrl: '',
    //     defaultColors: { primary: '#059669', secondary: '#10b981' },
    //     isActive: true
    // },
    // {
    //     name: 'Gym / Fitness Coach',
    //     templateKey: 'fitness',
    //     fileName: 'fitness',
    //     category: 'Health & Fitness',
    //     thumbnailUrl: '',
    //     defaultColors: { primary: '#dc2626', secondary: '#f97316' },
    //     isActive: true
    // }
];

async function seedTemplates() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI not set in .env');

        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
        console.log('✅ Connected to MongoDB');

        // Drop stale fileName unique index if it exists (migration safety)
        try {
            await VisitingCardTemplate.collection.dropIndex('fileName_1');
            console.log('ℹ️  Dropped old fileName_1 unique index');
        } catch (_) { /* Index may not exist — that is fine */ }

        for (const tmpl of templates) {
            const result = await VisitingCardTemplate.findOneAndUpdate(
                { templateKey: tmpl.templateKey },
                { $set: tmpl },
                { upsert: true, new: true, setDefaultsOnInsert: true, returnDocument: 'after' }
            );
            console.log(`✅ Seeded/Updated template: "${result.name}" (key: ${result.templateKey})`);
        }

        console.log('\n✨ Template seeding completed successfully.');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
        process.exit(1);
    }
}

seedTemplates();
