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

    // Debug info to help track what data is passed to the template
    console.log('[portfolioController] renderNewForm - params:', req.params || {});
    console.log('[portfolioController] renderNewForm - user:', req.user ? { id: req.user._id, slug: req.user.slug } : null);
    console.log('[portfolioController] renderNewForm - found profile:', !!profile, profile ? { id: profile._id, slug: profile.slug } : null);

    // Wrap render in its own try/catch to capture EJS compile/render errors
    try {
      // Ensure CSRF token (if csurf is enabled) is made available to the template
      let csrfToken;
      try {
        if (typeof req.csrfToken === 'function') csrfToken = req.csrfToken();
      } catch (e) {
        // ignore if not available
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

// Create portfolio (first call - creates draft if publish=false)
exports.createPortfolio = async (req, res) => {
  try {
    const payload = req.body || {};
    // Accept profile identifier from various form fields used by hotel form
    const profileIdentifier = payload.profileId || payload.selectedProfileId || payload.selectedProfileSlug || payload.profileSlug;
    if (!profileIdentifier) return res.status(400).send('profileId required');

    // Find profile by id or slug
    let profile = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(profileIdentifier)) {
      profile = await Profile.findById(profileIdentifier);
    }
    if (!profile) {
      // try as slug
      profile = await Profile.findOne({ slug: profileIdentifier });
    }

    if (!profile) return res.status(400).send('Profile not found');

    const p = new Portfolio({
      profileId: profile._id,
      slug: profile.slug,
      title: payload.title || payload.hotelName || '',
      tagline: payload.tagline || '',
      about: payload.about || '',
      social: payload.social || {},
      projects: payload.projects || [],
      services: payload.services || [],
      isPublished: payload.isPublished || false,
      createdBy: req.user ? req.user._id : undefined
    });
    await p.save();
    const accept = (req.headers['accept'] || '').toLowerCase();
    if (req.xhr || accept.includes('application/json') || req.is('json')) {
      return res.json({ ok: true, portfolio: p });
    }
    // redirect to profile portfolios list
    res.redirect(`/dashboard/${profile.slug}/portfolios`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating portfolio');
  }
};

// Update draft (autosave)
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

// Optional: publish (set isPublished=true)
exports.publishPortfolio = async (req, res) => {
  try {
    const id = req.params.id;
    const p = await Portfolio.findById(id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    p.isPublished = true;
    await p.save();
    res.json({ ok: true, portfolio: p });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Public view for a portfolio (renders only if published, but allows owner preview)
exports.showPublic = async (req, res) => {
  try {
    const id = req.params.id;
    const p = await Portfolio.findById(id).lean();
    if (!p) return res.status(404).send('Portfolio not found');

    // allow owner preview even if not published
    const isOwner = req.user && req.user._id && p.createdBy && String(p.createdBy) === String(req.user._id);
    if (!p.isPublished && !isOwner) return res.status(404).send('Portfolio not found');

    const profile = await Profile.findById(p.profileId).lean();
    return res.render('portfolios/public', { portfolio: p, profile, layout: 'layouts/portfolio-boilerplate' });
  } catch (err) {
    console.error('[portfolioController] showPublic error', err);
    res.status(500).send('Error loading portfolio');
  }
};



// Handle form submission to create a new visiting card
exports.createVisitingCard = async (req, res) => {
  try {
    const { name, title, description, email, phone, address, website, linkedin, twitter, facebook, instagram } = req.body;
    const visitingCard = new VisitingCard({
      user: req.user ? req.user._id : undefined,
      name,
      title,
      description,
      email,
      phone,
      address,
      website,
      linkedin,
      twitter,
      facebook,
      instagram
    });
    await visitingCard.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('portfolios/business/new', { error: 'Error creating visiting card', layout: 'layouts/dashboard-boilerplate' });
  }
};

// Fetch and show visiting card by user ID
exports.showVisitingCard = async (req, res) => {
  try {
    const visitingCard = await VisitingCard.findById(req.params.cardId);
    if (!visitingCard) return res.status(404).send('Visiting card not found');
    res.render('portfolios/business/visiting-card', { card: visitingCard });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading visiting card');
  }
};

// Dashboard business portfolio index page
exports.dashboardPortfolioIndex = async (req, res) => {
  try {
    let query = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = { $or: [ { name: searchRegex }, { slug: searchRegex } ] };
    }
    const cards = await VisitingCard.find(query);
    let slug = req.user && req.user.slug ? req.user.slug : '';
    // Ensure slug is never empty
    if (!slug && req.user) slug = req.user._id ? req.user._id.toString() : '';

    // Debug: log what will be passed to the template
    try {
      console.log('[portfolioController] dashboardPortfolioIndex - rendering portfolios/index with:', {
        source: 'dashboardPortfolioIndex',
        cardsCount: Array.isArray(cards) ? cards.length : 0,
        sampleCard: Array.isArray(cards) && cards.length ? { id: cards[0]._id, name: cards[0].name || null, slug: cards[0].slug || null } : null,
        slug
      });
    } catch (logErr) {
      console.error('[portfolioController] dashboardPortfolioIndex - log error', logErr);
    }

    res.render('portfolios/index', { cards, layout: 'layouts/dashboard-boilerplate', slug });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading business visiting cards');
  }
};


exports.listPortfolios = async (req, res) => {
  // List all portfolios for the user (by profile slug)
  const slugParam = req.params.slug;
  let profile = null;
  let portfolios = [];

  try {
    // Extra diagnostics: show overall counts to help debugging
    const totalPortfolios = await Portfolio.countDocuments();
    const byUserCount = req.user ? await Portfolio.countDocuments({ createdBy: req.user._id }) : 0;
    const sampleAny = await Portfolio.findOne({}).lean();
    console.log('[portfolioController] DEBUG totals:', { totalPortfolios, byUserCount, sampleAnyId: sampleAny ? sampleAny._id : null });
  } catch (diagErr) {
    console.error('[portfolioController] DEBUG error fetching totals', diagErr);
  }

  try {
    // If route uses special 'me' slug, list portfolios for profiles created by current user
    if (slugParam === 'me' && req.user) {
      const userProfiles = await Profile.find({ createdBy: req.user._id });
      if (userProfiles && userProfiles.length) {
        const ids = userProfiles.map(p => p._id);
        portfolios = await Portfolio.find({ profileId: { $in: ids } });
        // pick first profile as context
        profile = userProfiles[0];
      }
    } else {
      // try to find profile by slug
      profile = await Profile.findOne({ slug: slugParam });
      if (profile) {
        portfolios = await Portfolio.find({ profileId: profile._id });
      } else {
        // If the slug refers to the current logged-in user (own dashboard), list portfolios for profiles created by that user
        if (req.user && req.user.slug === slugParam) {
          const userProfiles = await Profile.find({ createdBy: req.user._id });
          if (userProfiles && userProfiles.length) {
            const ids = userProfiles.map(p => p._id);
            portfolios = await Portfolio.find({ profileId: { $in: ids } });
            profile = userProfiles[0];
          }
        }
        // fallback: some Portfolio documents use the profile slug in their `slug` field — try matching that
        if ((!portfolios || portfolios.length === 0) && !profile) {
          portfolios = await Portfolio.find({ slug: slugParam });
        }
        // last-resort: portfolios created by the current user
        if ((!portfolios || portfolios.length === 0) && req.user) {
          portfolios = await Portfolio.find({ createdBy: req.user._id });
        }
      }
    }

    // Debug: log what will be passed to the template
    try {
      console.log('[portfolioController] listPortfolios - rendering portfolios/index with:', {
        source: 'listPortfolios',
        profile: profile ? { id: profile._id, slug: profile.slug, name: profile.name || null } : null,
        portfoliosCount: Array.isArray(portfolios) ? portfolios.length : 0,
        samplePortfolio: Array.isArray(portfolios) && portfolios.length ? { id: portfolios[0]._id, title: portfolios[0].title || null, isPublished: portfolios[0].isPublished } : null,
        params: req.params
      });
    } catch (logErr) {
      console.error('[portfolioController] listPortfolios - log error', logErr);
    }

    res.render('portfolios/index', { portfolios, slug: req.params.slug, profile, layout: 'layouts/dashboard', currentUser: req.user });
  } catch (err) {
    console.error('[portfolioController] listPortfolios error:', err);
    res.status(500).send('Error loading portfolios');
  }
};

exports.deletePortfolio = async (req, res) => {
  // Delete a portfolio
  await Portfolio.findByIdAndDelete(req.params.id);
  res.redirect(`/dashboard/${req.params.slug}/portfolios`);
};

exports.showPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id).lean();
    if (!portfolio) return res.status(404).send('Portfolio not found');
    const profile = await Profile.findById(portfolio.profileId).lean();
    res.render('portfolios/show', { portfolio, profile, slug: req.params.slug, layout: 'layouts/dashboard', currentUser: req.user });
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
