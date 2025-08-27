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

exports.showPublic = async (req, res) => {
  try {
    const id = req.params.id;
    const p = await Portfolio.findById(id).lean();
    if (!p) return res.status(404).send('Portfolio not found');

    // allow owner preview even if not published
    const isOwner = req.user && req.user._id && p.createdBy && String(p.createdBy) === String(req.user._id);
    if (!p.isPublished && !isOwner) return res.status(404).send('Portfolio not found');

    const profile = await Profile.findById(p.profileId).lean();
    // render public portfolio using the updated view directory

    if (!slug && req.user) slug = req.user._id ? req.user._id.toString() : '';
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
