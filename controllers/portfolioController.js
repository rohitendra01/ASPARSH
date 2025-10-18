const { Portfolio } = require('../models/Portfolio');
const Profile = require('../models/Profile');
const VisitingCard = require('../models/VisitingCard');

exports.renderNewForm = async (req, res) => {
  try {
    // Find profile for context if slug provided
    let profile = null;
    if (req.params && req.params.slug) {
      profile = await Profile.findOne({ slug: req.params.slug });
    }

    // Wrap render in its own try/catch to capture EJS compile/render errors
    try {
      let csrfToken;
      try {
        if (typeof req.csrfToken === 'function') csrfToken = req.csrfToken();
      } catch (e) {
        // CSRF not available
      }
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
    } catch (renderErr) {
      console.error('[portfolioController] EJS render error for portfolios/new:', renderErr && renderErr.stack ? renderErr.stack : renderErr);
      res.status(500).send('<h2>Template render error</h2><pre>' + (renderErr && renderErr.stack ? renderErr.stack : String(renderErr)) + '</pre>');
      return;
    }
  } catch (err) {
    console.error('[portfolioController] Error in renderNewForm:', err && err.stack ? err.stack : err);
    res.status(500).send('Server error while preparing portfolio form');
  }
};

exports.createPortfolio = async (req, res) => {
  try {
    const payload = req.body || {};
    
    // ========== 1. Validate Profile ==========
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

    // ========== 2. Validate Design ==========
    const designId = payload.designId;
    if (!designId || !mongoose.Types.ObjectId.isValid(designId)) {
      return res.status(400).json({ success: false, message: 'Valid Design ID required' });
    }

    const design = await Design.findById(designId);
    if (!design) {
      return res.status(400).json({ success: false, message: 'Design not found' });
    }

    // ========== 3. Generate Unique Slug ==========
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

    // Append random ID to ensure uniqueness
    const crypto = require('crypto');
    const uniqueId = crypto.randomBytes(5).toString('hex');
    const finalSlug = `${baseSlug}-${uniqueId}`;

    // ========== 4. Process Social Links ==========
    const socialLinks = [];
    const socialPlatforms = Object.keys(payload).filter(key => key.startsWith('socialPlatform_'));
    
    socialPlatforms.forEach(key => {
      const id = key.split('_')[1];
      const platform = payload[`socialPlatform_${id}`];
      const url = payload[`socialUrl_${id}`];
      
      if (platform && url) {
        socialLinks.push({ platform, url });
      }
    });

    // ========== 5. Process Skills ==========
    let skills = [];
    try {
      if (payload.skills) {
        skills = typeof payload.skills === 'string' 
          ? JSON.parse(payload.skills) 
          : payload.skills;
      }
    } catch (e) {
      console.error('Error parsing skills:', e);
    }

    // ========== 6. Process Work Experience ==========
    const workExperience = [];
    const workCategories = Object.keys(payload).filter(key => key.startsWith('workCategory_'));
    
    workCategories.forEach(key => {
      const id = key.split('_')[1];
      const category = payload[`workCategory_${id}`];
      const title = payload[`workTitle_${id}`];
      const description = payload[`workDescription_${id}`];
      const detailsUrl = payload[`workDetailsUrl_${id}`];
      
      if (category && title && description && detailsUrl) {
        workExperience.push({ category, title, description, detailsUrl });
      }
    });

    // ========== 7. Process Experience Timeline ==========
    const experience = [];
    const expDateRanges = Object.keys(payload).filter(key => key.startsWith('expDateRange_'));
    
    expDateRanges.forEach(key => {
      const id = key.split('_')[1];
      const dateRange = payload[`expDateRange_${id}`];
      const roleTitle = payload[`expRoleTitle_${id}`];
      const organization = payload[`expOrganization_${id}`];
      const description = payload[`expDescription_${id}`];
      
      if (dateRange && roleTitle && organization && description) {
        experience.push({ dateRange, roleTitle, organization, description });
      }
    });

    // ========== 8. Process Gallery Images ==========
    // This will be handled by Cloudinary upload in the route
    let galleryImages = [];
    if (payload.galleryImageUrls) {
      try {
        galleryImages = typeof payload.galleryImageUrls === 'string' 
          ? JSON.parse(payload.galleryImageUrls) 
          : payload.galleryImageUrls;
      } catch (e) {
        console.error('Error parsing gallery images:', e);
      }
    }

    // ========== 9. Process Hero & About Images ==========
    let heroImage = 'https://placehold.co/160x160';
    let aboutImage = 'https://placehold.co/600x400';

    // These will be set after Cloudinary upload in route middleware
    if (payload.heroImageUrl) heroImage = payload.heroImageUrl;
    if (payload.aboutImageUrl) aboutImage = payload.aboutImageUrl;

    // ========== 10. Create Portfolio Document ==========
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
      createdBy: req.user ? req.user._id : profile.createdBy
    });

    // ========== 11. Save Portfolio ==========
    try {
      await portfolio.save();
    } catch (saveErr) {
      // Handle duplicate slug error
      if (saveErr && saveErr.code === 11000 && saveErr.keyPattern && saveErr.keyPattern.slug) {
        const newUniqueId = crypto.randomBytes(5).toString('hex');
        portfolio.slug = `${baseSlug}-${newUniqueId}`;
        await portfolio.save();
      } else {
        throw saveErr;
      }
    }

    // ========== 12. Update Profile Reference ==========
    await Profile.findByIdAndUpdate(
      profile._id,
      { $push: { portfolio: portfolio._id } }
    );

    // ========== 13. Send Response ==========
    const accept = (req.headers['accept'] || '').toLowerCase();
    if (req.xhr || accept.includes('application/json') || req.is('json')) {
      return res.json({ 
        success: true, 
        portfolio: portfolio,
        slug: portfolio.slug,
        message: 'Portfolio created successfully'
      });
    }

    // Redirect to portfolio view
    res.redirect(`/portfolio/${portfolio.slug}`);

  } catch (err) {
    console.error('[portfolioController] Error creating portfolio:', err);
    
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

exports.updatePortfolio = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body || {};
    const p = await Portfolio.findById(id);
    if (!p) return res.status(404).send('Not found');

    // Basic copy of allowed fields
    const allowed = ['title','tagline','about','social','projects','services','isPublished'];
    allowed.forEach(k => { if (updates[k] !== undefined) p[k] = updates[k]; });

    await p.save();
    const accept = (req.headers['accept'] || '').toLowerCase();
    if (req.xhr || accept.includes('application/json') || req.is('json')) {
      return res.json({ ok: true, portfolio: p });
    }
    res.redirect(`/dashboard/${req.params.slug}/portfolios`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating portfolio');
  }
};




exports.listPortfolios = async (req, res) => {
  // List all portfolios for the user (by profile slug)
  const slugParam = req.params.slug;
  let profile = null;
  let portfolios = [];

try {
    // List all portfolios created by the logged-in admin user (createdBy)
    portfolios = await Portfolio.find({ createdBy: req.user._id });
    res.render('portfolios/index', { portfolios, slug: req.params.slug, layout: 'layouts/dashboard', currentUser: req.user });
  } catch (err) {
    res.status(500).send('Error loading portfolios');
  }
};

exports.deletePortfolio = async (req, res) => {
  await Portfolio.findByIdAndDelete(req.params.id);
  res.redirect(`/dashboard/${req.params.slug}/portfolios`);
};

exports.showPortfolio = async (req, res) => {
  try {
    // Accept several possible param names depending on route: id, slug, profileSlug
    const identifier = req.params.id || req.params.slug || req.params.profileSlug || req.params.profile;
    let portfolio = null;

    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      portfolio = await Portfolio.findById(identifier).lean();
    }
    if (!portfolio) {
      portfolio = await Portfolio.findOne({ slug: identifier }).lean();
    }
    if (!portfolio) return res.status(404).send('Portfolio not found');

    const profile = await Profile.findById(portfolio.profileId).lean();

  portfolio.seo = portfolio.seo || { title: '', description: '', keywords: [], ogImage: '' };
  portfolio.theme = portfolio.theme || { primary: '#007bff', secondary: '#6c757d', background: '#ffffff', text: '#212529', font: 'Montserrat' };
  if (!profile) profile = { name: '', image: 'https://placehold.co/160x160' };
  profile.image = profile.image || 'https://placehold.co/160x160';
  res.render('portfolios/basic-portfolio/show', { portfolio, profile, layout: false });
  } catch (err) {
    res.status(500).send('Error loading portfolio');
  }
};

exports.renderEditForm = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id).lean();
    if (!portfolio) return res.status(404).send('Portfolio not found');
    const profile = await Profile.findById(portfolio.profileId).lean();
    res.render('portfolios/edit', { portfolio, profile, slug: req.params.slug, layout: 'layouts/dashboard', currentUser: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading edit form');
  }
};
