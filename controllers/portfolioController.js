const Portfolio = require('../models/Portfolio');
const Profile = require('../models/Profile');
const VisitingCard = require('../models/VisitingCard');

exports.renderNewForm = async (req, res) => {
  try {
    // find profile for context
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
      }
      if (!csrfToken && res && res.locals && res.locals.csrfToken) csrfToken = res.locals.csrfToken;
  return res.render('portfolios/new', { user: req.user || null, slug: req.params ? req.params.slug : undefined, profile, layout: 'layouts/dashboard-boilerplate', csrfToken });
    } catch (renderErr) {
      console.error('[portfolioController] EJS render error for portfolios/new:', renderErr && renderErr.stack ? renderErr.stack : renderErr);
      // Return a helpful error response for debugging (include stack)
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
    // Accept profile identifier from several possible fields (wizard may send profileId)
    const profileIdentifier = payload.profileId || payload.selectedProfileId || payload.profileSlug || payload.selectedProfileSlug || payload.profileId || payload.profile;
    if (!profileIdentifier) return res.status(400).send('profileId required');

    // Find profile by id or slug
    let profile = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(profileIdentifier)) {
      profile = await Profile.findById(profileIdentifier);
    }
    if (!profile) {
      profile = await Profile.findOne({ slug: profileIdentifier });
    }
    if (!profile) return res.status(400).send('Profile not found');

    // If client submitted a portfolioData JSON (from older forms), parse it
    let portfolioData = {};
    if (payload.portfolioData) {
      try { portfolioData = typeof payload.portfolioData === 'string' ? JSON.parse(payload.portfolioData) : payload.portfolioData; } catch (e) { portfolioData = {}; }
    }

    // Map fields: prefer top-level fields from wizard, fall back to portfolioData, then profile values
    const title = payload.title || portfolioData.title || profile.name || '';
    const tagline = payload.tagline || portfolioData.tagline || '';
    const about = payload.about || portfolioData.about || payload.description || '';

    // Social is sent as an object by the wizard
    const social = Object.assign({}, (portfolioData.social || {}), (payload.social || {}));
    // Backwards compatibility for some legacy field names
    if (!social.facebook && payload.faceBookUrl) social.facebook = payload.faceBookUrl;
    if (!social.linkedin && payload.linkedInUrl) social.linkedin = payload.linkedInUrl;
    if (!social.x && payload.twitterUrl) social.x = payload.twitterUrl;
    if (!social.instagram && payload.instaUrl) social.instagram = payload.instaUrl;
    if (!social.dribbble && payload.dribbleUrl) social.dribbble = payload.dribbleUrl;
    if (!social.website && payload.otherUrl) social.website = payload.otherUrl;

  // Gallery: collect descriptions and uploaded file names if present
    const gallery = [];
    for (let i = 1; i <= 4; i++) {
      const desc = payload[`description${i}`];
      let imageUrl = '';

      // Check parsed portfolioData.gallery first
      if (portfolioData.gallery && portfolioData.gallery[i-1]) {
        imageUrl = portfolioData.gallery[i-1].imageUrl || portfolioData.gallery[i-1].imageName || '';
      }

      // Check uploaded files (support typical multer shapes)
      if (req.files) {
        // req.files can be object of arrays or array
        if (Array.isArray(req.files)) {
          const f = req.files.find(x => x.fieldname === `image${i}`);
          if (f) imageUrl = f.filename || f.originalname || imageUrl;
        } else if (req.files[`image${i}`]) {
          const farr = req.files[`image${i}`];
          if (Array.isArray(farr) && farr[0]) imageUrl = farr[0].filename || farr[0].originalname || imageUrl;
        }
      }

        if (imageUrl || desc) {
          gallery.push({ imageUrl, title: '', description: desc || '' });
        }
    }

    // Map services: wizard sends payload.services as array
    const servicesArr = Array.isArray(payload.services) && payload.services.length ? payload.services : (portfolioData.services || []);

    // generate a safe slug: prefer provided slug/title, fall back to profile slug; append timestamp if needed
    const slugify = (s='') => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    let baseSlug = '';
    if (payload.slug) baseSlug = payload.slug;
    else if (portfolioData.slug) baseSlug = portfolioData.slug;
    else if (title) baseSlug = title;
    else baseSlug = profile.slug || profile.name || profile._id.toString();
    baseSlug = slugify(baseSlug) || profile.slug || profile._id.toString();
    // append timestamp to avoid unique conflicts when multiple portfolios per profile are created
    const finalSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const p = new Portfolio({
      profileId: profile._id,
      slug: finalSlug,
      title,
      tagline,
      about,
      social,
      gallery: gallery.length ? gallery : (portfolioData.gallery || []),
      skills: payload.skills || portfolioData.skills || [],
      projects: Array.isArray(payload.projects) && payload.projects.length ? payload.projects : (portfolioData.projects || []),
      services: servicesArr,
      isPublished: (payload.isPublished === 'on' || payload.isPublished === true || portfolioData.isPublished === true) || false,
      createdBy: req.user ? req.user._id : undefined
    });

    try {
      await p.save();
    } catch (saveErr) {
      // if duplicate key on slug, try a fallback by appending a random suffix
      if (saveErr && saveErr.code === 11000 && saveErr.keyPattern && saveErr.keyPattern.slug) {
        p.slug = `${baseSlug}-${Math.floor(Math.random() * 90000) + 10000}`;
        await p.save();
      } else throw saveErr;
    }

    // respond JSON if requested (wizard expects JSON containing created portfolio id)
    const accept = (req.headers['accept'] || '').toLowerCase();
    if (req.xhr || accept.includes('application/json') || req.is('json')) return res.json({ ok: true, portfolio: p });

    // otherwise redirect to public show route (we use /portfolios/:id)
    res.redirect(`/portfolios/${p._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating portfolio');
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
