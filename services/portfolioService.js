const crypto = require('crypto');
const mongoose = require('mongoose');
const portfolioRepository = require('../repositories/portfolioRepository');
const Profile = require('../models/Profile');
const Design = require('../models/Design');
const { QR } = require('../models/QR');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');

const parseJsonField = (field) => {
    if (!field) return [];
    try {
        return typeof field === 'string' ? JSON.parse(field) : field;
    } catch (e) {
        return [];
    }
};

const generateSlug = (baseName) => {
    const slugify = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const uniqueId = crypto.randomBytes(5).toString('hex');
    return `${slugify(baseName)}-${uniqueId}`;
};

exports.processPortfolioCreation = async (payload, files, userId) => {
    const profileIdentifier = payload.profileId || payload.selectedProfileId || payload.profileSlug;
    if (!profileIdentifier) throw new Error('Profile ID required');

    let profile = mongoose.Types.ObjectId.isValid(profileIdentifier)
        ? await Profile.findById(profileIdentifier)
        : await Profile.findOne({ slug: profileIdentifier });

    if (!profile) throw new Error('Profile not found');
    if (!payload.designId || !mongoose.Types.ObjectId.isValid(payload.designId)) {
        throw new Error('Valid Design ID required');
    }
    const design = await Design.findById(payload.designId);
    if (!design) throw new Error('Design not found');

    const qrSlug = payload.qrSlug || payload.qrCode;
    let dynamicLinkDoc = qrSlug ? await QR.findOne({ shortId: qrSlug }) : null;

    const baseSlugName = payload.name || profile.name || profile.slug || profile._id.toString();
    const finalSlug = generateSlug(baseSlugName);

    let heroImage = 'https://placehold.co/160x160';
    let aboutImage = 'https://placehold.co/600x400';
    let galleryImages = [];

    if (files?.heroImage?.[0]) {
        const upload = await uploadToCloudinary(files.heroImage[0].buffer, 'heroImage', files.heroImage[0].mimetype);
        heroImage = upload.secure_url;
    }
    if (files?.aboutImage?.[0]) {
        const upload = await uploadToCloudinary(files.aboutImage[0].buffer, 'aboutImage', files.aboutImage[0].mimetype);
        aboutImage = upload.secure_url;
    }
    if (files?.galleryImages?.length > 0) {
        const galleryResults = await Promise.all(
            files.galleryImages.map(file => uploadToCloudinary(file.buffer, 'galleryImages', file.mimetype))
        );
        galleryImages = galleryResults.map(res => res.secure_url);
    }

    const socialLinks = parseJsonField(payload.socialLinks);
    const workExperience = parseJsonField(payload.workExperience);
    const experience = parseJsonField(payload.experienceTimeline);

    const rawSkills = parseJsonField(payload.skills);
    const skills = rawSkills.map(skill => skill.id || skill._id || skill);
    const createdById = userId || profile.createdBy || profile._id;
    if (!createdById) throw new Error('Unable to determine portfolio creator');

    let portfolio;
    try {
        portfolio = await portfolioRepository.createPortfolio({
            profileId: profile._id, slug: finalSlug, name: payload.name || profile.name,
            profession: payload.profession || 'Professional', briefIntro: payload.briefIntro || 'Brief intro.',
            heroImage, aboutImage, galleryImages, socialLinks, skills, workExperience, experience,
            aboutDescription: payload.aboutDescription || 'Detailed description.',
            design: design._id, qrCode: dynamicLinkDoc ? dynamicLinkDoc._id : undefined,
            tenantId: createdById
        });
    } catch (saveErr) {
        if (saveErr.code === 11000) {
            payload.name = `${baseSlugName}-${crypto.randomBytes(2).toString('hex')}`;
            return this.processPortfolioCreation(payload, files, userId);
        }
        throw saveErr;
    }

    if (dynamicLinkDoc) {
        dynamicLinkDoc.status = 'LIVE';
        dynamicLinkDoc.destinationUrl = `/portfolio/${portfolio.slug}`;
        await dynamicLinkDoc.save();
    }
    await Profile.findByIdAndUpdate(profile._id, { $push: { portfolio: portfolio._id } });

    return { portfolio, dynamicLinkDoc };
};

exports.processPortfolioDeletion = async (id) => {
    const portfolio = await portfolioRepository.softDeletePortfolio(id, null);
    if (!portfolio) throw new Error('Portfolio not found');

    await Profile.findByIdAndUpdate(portfolio.profileId, { $pull: { portfolio: portfolio._id } });
    return portfolio;
};