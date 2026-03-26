const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const { Portfolio } = require('../models/Portfolio');
const Profile = require('../models/Profile');
const Design = require('../models/Design');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');

// ========== 1. LIST ALL PORTFOLIOS ==========
exports.listPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find({})
      .populate('profileId', 'name slug image')
      .populate('design', 'name templatePath category')
      .lean();

    res.render('portfolios/index', {
      user: req.user || null,
      portfolios,
      layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    res.status(500).send('Error retrieving portfolios');
  }
};

// ========== 2. SHOW CREATE FORM ==========
exports.showCreateForm = async (req, res) => {
  try {
    let profile = null;
    if (req.params && req.params.slug) {
      profile = await Profile.findOne({ slug: req.params.slug });
    }

    // Obtain CSRF token if available
    let csrfToken;
    try {
      if (typeof req.csrfToken === 'function') csrfToken = req.csrfToken();
    } catch (e) { }
    if (!csrfToken && res && res.locals && res.locals.csrfToken) {
      csrfToken = res.locals.csrfToken;
    }

    return res.render('portfolios/new', {
      user: req.user || null,
      slug: req.params ? req.params.slug : undefined,
      profile,
      layout: 'layouts/dashboard-boilerplate',
      csrfToken
    });
  } catch (err) {
    res.status(500).send('Error rendering form');
  }
};

// ========== 3. CREATE PORTFOLIO ==========
exports.createPortfolio = async (req, res) => {
  try {
    const payload = req.body || {};

    // ========== 3.1. Validate Profile ==========
    const profileIdentifier = payload.profileId || payload.selectedProfileId || payload.profileSlug;
    if (!profileIdentifier) {
      return res.status(400).json({ success: false, message: 'Profile ID required' });
    }

    let profile = null;
    if (mongoose.Types.ObjectId.isValid(profileIdentifier)) {
      profile = await Profile.findById(profileIdentifier);
    }
    if (!profile) {
      profile = await Profile.findOne({ slug: profileIdentifier });
    }
    if (!profile) {
      return res.status(400).json({ success: false, message: 'Profile not found' });
    }

    // ========== 3.2. Validate Design ==========
    const designId = payload.designId;
    if (!designId || !mongoose.Types.ObjectId.isValid(designId)) {
      return res.status(400).json({ success: false, message: 'Valid Design ID required' });
    }

    const design = await Design.findById(designId);
    if (!design) {
      return res.status(400).json({ success: false, message: 'Design not found' });
    }

    // Fetch distinct categories for the wizard
    const professions = await Design.find({ isActive: true }).distinct('category');

    // ========== 3.2.1. Process QR Link ==========
    const qrSlug = payload.qrSlug || payload.qrCode;
    let dynamicLinkDoc = null;
    if (qrSlug) {
      const { QR } = require('../models/QR');
      dynamicLinkDoc = await QR.findOne({ shortId: qrSlug });
    }

    // ========== 3.3. Generate Unique Slug ==========
    const slugify = (s = '') => String(s).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let baseSlug = '';
    if (payload.name) {
      baseSlug = slugify(payload.name);
    } else if (profile.name) {
      baseSlug = slugify(profile.name);
    } else {
      baseSlug = profile.slug || profile._id.toString();
    }

    const uniqueId = crypto.randomBytes(5).toString('hex');
    const finalSlug = `${baseSlug}-${uniqueId}`;

    // ========== 3.4. Process Uploaded Images (NEW - With uploadToCloudinary) ==========
    let heroImage = 'https://placehold.co/160x160';
    let aboutImage = 'https://placehold.co/600x400';
    let galleryImages = [];

    try {
      // Upload heroImage
      if (req.files?.heroImage?.[0]) { // Corrected syntax here
        const heroFile = req.files.heroImage[0]; // Access the first file in the array
        const heroResult = await uploadToCloudinary(
          heroFile.buffer,
          'heroImage',
          heroFile.mimetype
        );
        heroImage = heroResult.secure_url;
      }

      // Upload aboutImage
      if (req.files?.aboutImage?.[0]) { // Corrected syntax here
        const aboutFile = req.files.aboutImage[0]; // Access the first file in the array
        const aboutResult = await uploadToCloudinary(
          aboutFile.buffer,
          'aboutImage',
          aboutFile.mimetype
        );
        aboutImage = aboutResult.secure_url;
      }

      // Upload galleryImages
      if (req.files?.galleryImages?.length > 0) {
        const galleryResults = await Promise.all(
          req.files.galleryImages.map(file =>
            uploadToCloudinary(file.buffer, 'galleryImages', file.mimetype)
          )
        );
        galleryImages = galleryResults.map(result => result.secure_url);
      }
    } catch (uploadErr) {
      return res.status(400).json({
        success: false,
        message: 'Failed to upload images: ' + uploadErr.message
      });
    }

    // ========== 3.5. Process Social Links ==========
    let socialLinks = [];
    try {
      if (payload.socialLinks) {
        socialLinks = typeof payload.socialLinks === 'string'
          ? JSON.parse(payload.socialLinks)
          : payload.socialLinks;
      }
    } catch (e) {
    }

    // ========== 3.6. Process Skills ==========
    let skills = [];
    try {
      if (payload.skills) {
        const skillsData = typeof payload.skills === 'string'
          ? JSON.parse(payload.skills)
          : payload.skills;

        // Extract only ObjectIds
        skills = skillsData.map(skill => skill.id || skill._id || skill);
      }
    } catch (e) {
    }

    // ========== 3.7. Process Work Experience ==========
    let workExperience = [];
    try {
      if (payload.workExperience) {
        workExperience = typeof payload.workExperience === 'string'
          ? JSON.parse(payload.workExperience)
          : payload.workExperience;
      }
    } catch (e) {
    }

    // ========== 3.8. Process Experience Timeline ==========
    let experience = [];
    try {
      if (payload.experienceTimeline) {
        experience = typeof payload.experienceTimeline === 'string'
          ? JSON.parse(payload.experienceTimeline)
          : payload.experienceTimeline;
      }
    } catch (e) {
    }

    // ========== 3.9. Validate createdBy ==========
    const createdById = req.user?._id || profile.createdBy || profile._id;

    if (!createdById) {
      return res.status(400).json({
        success: false,
        message: 'Unable to determine portfolio creator'
      });
    }

    // ========== 3.10. Create Portfolio Document ==========
    const portfolio = new Portfolio({
      profileId: profile._id,
      slug: finalSlug,
      name: payload.name || profile.name,
      profession: payload.profession || 'Professional',
      briefIntro: payload.briefIntro || 'This is a brief introduction about me.',
      heroImage,
      socialLinks,
      aboutImage,
      aboutDescription: payload.aboutDescription || 'This is a detailed description about me.',
      galleryImages,
      skills,
      workExperience,
      experience,
      design: design._id,
      qrCode: dynamicLinkDoc ? dynamicLinkDoc._id : undefined,
      createdBy: createdById
    });

    // ========== 3.11. Save Portfolio ==========
    try {
      await portfolio.save();

      // ========== 3.11.1. Update QR Link ==========
      if (dynamicLinkDoc) {
        dynamicLinkDoc.status = 'LIVE';
        // Note: keeping portfolioId tracking would require adding portfolio ref to QR, but for now we just link destUrl
        dynamicLinkDoc.destinationUrl = `${req.protocol}://${req.get('host')}/portfolio/${portfolio.slug}`;
        await dynamicLinkDoc.save();
      }
    } catch (saveErr) {
      if (saveErr && saveErr.code === 11000 && saveErr.keyPattern && saveErr.keyPattern.slug) {
        const newUniqueId = crypto.randomBytes(5).toString('hex');
        portfolio.slug = `${baseSlug}-${newUniqueId}`;
        await portfolio.save();
      } else {
        throw saveErr;
      }
    }

    // ========== 3.12. Update Profile Reference ==========
    await Profile.findByIdAndUpdate(
      profile._id,
      { $push: { portfolio: portfolio._id } }
    );

    // ========== 3.13. Send Response ==========
    const accept = (req.headers['accept'] || '').toLowerCase();
    if (req.xhr || accept.includes('application/json') || req.is('json')) {
      return res.json({
        success: true,
        portfolio: portfolio,
        slug: portfolio.slug,
        message: 'Portfolio created successfully'
      });
    }

    res.redirect(`/portfolio/${portfolio.slug}`);

  } catch (err) {

    const accept = (req.headers['accept'] || '').toLowerCase();
    if (req.xhr || accept.includes('application/json') || req.is('json')) {
      return res.status(500).json({
        success: false,
        message: 'Error creating portfolio',
        error: err.message
      });
    }

    res.status(500).send('Error creating portfolio: ' + err.message);
  }
};

// ========== 4. GET PORTFOLIO BY SLUG (JSON API) ==========
exports.getPortfolioBySlug = async (req, res) => {
  try {

    const portfolio = await Portfolio.findOne({ slug: req.params.slug })
      .populate('skills', 'name iconClass description')
      .populate('design', 'name templatePath category')
      .populate('profileId', 'name email mobile image')
      .lean();

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }


    res.json({
      success: true,
      portfolio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ========== 5. SHOW PORTFOLIO (HTML VIEW - DYNAMIC ROUTING) ==========
/**
 * Renders portfolio using the selected design template
 * Routes to: views/{design.templatePath}.ejs
 */
exports.showPortfolio = async (req, res) => {
  try {

    // Fetch portfolio with design
    const portfolio = await Portfolio.findOne({ slug: req.params.slug })
      .populate('skills', 'name iconClass description')
      .populate('design', 'name slug templatePath category')
      .populate('profileId', 'name email mobile image')
      .lean();

    if (!portfolio) {
      return res.status(404).render('error', {
        title: 'Portfolio Not Found',
        message: 'The portfolio you are looking for does not exist.',
        statusCode: 404
      });
    }


    // Check design exists
    if (!portfolio.design) {
      return res.status(404).render('error', {
        title: 'Design Not Found',
        message: 'The design for this portfolio is not available.',
        statusCode: 404
      });
    }

    const designTemplatePath = portfolio.design.templatePath;

    res.render(designTemplatePath, {
      title: `${portfolio.name} - Portfolio`,
      portfolio: portfolio
    });

  } catch (error) {
    console.error('❌ Error rendering portfolio:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'An error occurred while loading the portfolio.',
      statusCode: 500,
      error: error.message
    });
  }
};

// ========== 6. DELETE PORTFOLIO ==========
exports.deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findByIdAndDelete(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Remove portfolio reference from profile
    await Profile.findByIdAndUpdate(
      portfolio.profileId,
      { $pull: { portfolio: portfolio._id } }
    );

    console.log('✅ Portfolio deleted:', portfolio.slug);

    res.json({
      success: true,
      message: 'Portfolio deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting portfolio',
      error: error.message
    });
  }
};

// ========== 7. UPDATE PORTFOLIO ==========
exports.updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const portfolio = await Portfolio.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('skills').populate('design').lean();

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    console.log('✅ Portfolio updated:', portfolio.slug);

    res.json({
      success: true,
      portfolio,
      message: 'Portfolio updated successfully'
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating portfolio',
      error: error.message
    });
  }
};

// ========== 8. LIST USER PORTFOLIOS ==========
exports.listUserPortfolios = async (req, res) => {
  try {
    const { profileId } = req.params;

    const portfolios = await Portfolio.find({ profileId })
      .populate('design', 'name slug category templatePath')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${portfolios.length} portfolios for profile: ${profileId}`);

    res.json({
      success: true,
      count: portfolios.length,
      portfolios
    });
  } catch (error) {
    console.error('Error listing portfolios:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing portfolios',
      error: error.message
    });
  }
};
