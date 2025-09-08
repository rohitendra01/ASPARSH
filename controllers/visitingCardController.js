const VisitingCard = require('../models/VisitingCard');
const Profile = require('../models/Profile');
const mongoose = require('mongoose');

// Helper to consistently extract CSRF token: try req.csrfToken() then fallback to res.locals.csrfToken
const getCsrfToken = (req, res) => {
  let token;
  let generationError = null;
  if (typeof req.csrfToken === 'function') {
    try {
      token = req.csrfToken();
    } catch (e) {
      generationError = e;
      const reqId = req.id || (req.headers && (req.headers['x-request-id'] || req.headers['x-request_id'])) || null;
      const userId = req.user && (req.user._id || req.user.id) ? String(req.user._id || req.user.id) : null;
      console.error('CSRF token generation failed', { message: e && e.message, stack: e && e.stack, reqId, userId });
    }
  }
  if (!token && res && res.locals && res.locals.csrfToken) token = res.locals.csrfToken;
  return { token, generationError };
};

// Render new visiting card form
exports.renderNewForm = async (req, res) => {
  try {
    let profile = null;
    if (req.params && req.params.slug) {
      profile = await Profile.findOne({ slug: req.params.slug });
    }

    // Consolidated CSRF extraction
    const { token: csrfToken, generationError } = getCsrfToken(req, res);
    if (generationError) {
      const slugFallback = (req.params && req.params.slug) || (req.user && req.user.slug) || '';
      return res.status(500).render('visiting-cards/new', {
        profile,
        user: req.user || null,
        slug: slugFallback,
        csrfToken: null,
        error: 'Unable to generate security token for this form. Please try again.',
        layout: 'layouts/dashboard-boilerplate'
      });
    }

    // Compute slug using safe fallbacks. Ensure we don't read properties off undefined.
    const slug = (req.params && req.params.slug) || (req.user && req.user.slug) || '';

    return res.render('visiting-cards/new', {
      profile,
      user: req.user || null,
      slug,
      csrfToken,
      layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    const reqId = req.id || req.headers && (req.headers['x-request-id'] || req.headers['x-request_id']) || null;
    const userId = req.user && (req.user._id || req.user.id) ? String(req.user._id || req.user.id) : null;
    console.error('Error rendering visiting card form', { error: err && (err.stack || err.message || err), reqId, userId });
    res.status(500).send('Error rendering form. Please try again later.');
  }
};
// Create visiting card
exports.create = async (req, res) => {
  try {
    // Require authenticated user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const body = req.body || {};
  const rawProfileSlug = body.profileSlug || '';
    let profile = null;

    // If a profile slug was provided, load the profile and ensure ownership
    if (rawProfileSlug) {
      profile = await Profile.findOne({ slug: rawProfileSlug }).lean();
      if (!profile) return res.status(404).json({ error: 'Profile not found for provided slug' });
      const profileOwner = profile.user || profile.owner || null;
      if (profileOwner && String(profileOwner) !== String(req.user._id)) {
        console.warn('Unauthorized profile access attempt', { profileSlug: rawProfileSlug, attemptedBy: String(req.user._id) });
        return res.status(403).json({ error: 'Forbidden: you do not own the specified profile' });
      }
    }

  let { title, description, website } = body;

    title = typeof title === 'string' ? title.trim() : title;
    description = typeof description === 'string' ? description.trim() : description;

    // Validate required fields (title and description remain required for the card)
    const validationErrors = [];
    if (!title) validationErrors.push({ field: 'title', message: 'Title is required' });
    if (!description) validationErrors.push({ field: 'description', message: 'Description is required' });
    if (validationErrors.length > 0) return res.status(400).json({ errors: validationErrors });

    const visitingCard = new VisitingCard({
      user: req.user._id,
      profileSlug: profile ? profile.slug : (body.profileSlug || undefined),
      title,
      description,
      website: typeof website === 'string' ? website.trim() : website,
      
      createdByAdminUsername: req.user ? (req.user.username || req.user.slug || '') : '',
      createdByAdmin: req.user ? req.user._id : undefined
    });

    await visitingCard.save();

    const redirectTo = (profile && profile.slug) ? `/dashboard/${profile.slug}/visiting-cards` : (req.user && req.user.slug ? `/dashboard/${req.user.slug}/visiting-cards` : '/dashboard');
    res.redirect(redirectTo);
  } catch (err) {
    console.error('Error creating visiting card', { error: err && (err.stack || err.message || err), userId: req.user && req.user._id ? String(req.user._id) : null });
    res.status(500).render('visiting-cards/new', { error: 'Error creating visiting card', layout: 'layouts/dashboard-boilerplate' });
  }
};

// Public: show visiting card by profile slug at /visiting-card/:profileSlug
exports.showByProfile = async (req, res) => {
  try {
    const slug = req.params.profileSlug;
    if (!slug) return res.status(400).send('Profile slug required');
    const profile = await Profile.findOne({ slug });
    if (!profile) return res.status(404).send('Profile not found');
    // pick the latest visiting card for that profile
  const visitingCard = await VisitingCard.findOne({ profileSlug: profile.slug }).sort({ createdAt: -1 });
  if (!visitingCard) return res.status(404).send('Visiting card not found for this profile');
  // Pass both the visiting card and the profile so the view can prefer profile data
  res.render('visiting-cards/show', { card: visitingCard, profile });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading visiting card');
  }
};

// List visiting cards for dashboard (by profile or user)
exports.list = async (req, res) => {
  try {
    // Build filters as an array and combine with $and so we don't overwrite clauses
    const filters = [];
    if (req.params && req.params.slug) {
      const profile = await Profile.findOne({ slug: req.params.slug });
      if (profile) {
        // show cards linked to this profileSlug OR cards created by the logged-in user
        if (req.user && req.user._id) {
          filters.push({ $or: [ { profileSlug: profile.slug }, { user: req.user._id } ] });
        } else {
          filters.push({ profileSlug: profile.slug });
        }
      }
    } else if (req.user && req.user._id) {
      filters.push({ user: req.user._id });
    }
    if (req.query && req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filters.push({ $or: [ { name: searchRegex }, { slug: searchRegex } ] });
    }
    // assemble final query
    const query = (filters.length > 0) ? { $and: filters } : {};
    // include profile summary where possible to allow view to render profile data
    const cards = await VisitingCard.find(query).lean();
    // attach profile summary fields for each card to avoid extra lookups in the view
    const profileSlugs = cards.filter(c => c.profileSlug).map(c => String(c.profileSlug));
    let profilesMap = {};
    if (profileSlugs.length) {
      const profiles = await Profile.find({ slug: { $in: profileSlugs } }).lean();
      profilesMap = profiles.reduce((acc, p) => { acc[String(p.slug)] = p; return acc; }, {});
    }
    cards.forEach(c => {
      if (c.profileSlug && profilesMap[String(c.profileSlug)]) {
        const p = profilesMap[String(c.profileSlug)];
        c.profileName = p.name;
        c.profileSlug = p.slug;
        c.profileImage = p.image;
      }
    });
    const slug = (req.params && req.params.slug) || (req.user && req.user.slug) || '';
    // render the visiting-cards index view so sidebar opens the correct page
    res.render('visiting-cards/index', { cards, layout: 'layouts/dashboard-boilerplate', slug });
  } catch (err) {
    console.error('Error listing visiting cards', err);
    res.status(500).send('Error loading visiting cards');
  }
};

exports.renderEditForm = async (req, res) => {
  try {
    const maybeId = req.params.id || null;
    const maybeProfileSlug = req.params.profileSlug || null;

    let card = null;
    let profile = null;

    if (maybeId && mongoose.Types.ObjectId.isValid(maybeId)) {
      card = await VisitingCard.findById(maybeId).lean();
      if (!card) return res.status(404).send('Visiting card not found');
      if (card.profileSlug) profile = await Profile.findOne({ slug: card.profileSlug }).lean();
    } else if (maybeProfileSlug) {
      profile = await Profile.findOne({ slug: maybeProfileSlug }).lean();
      if (!profile) return res.status(404).send('Profile not found');
      card = await VisitingCard.findOne({ profileSlug: profile.slug }).sort({ createdAt: -1 }).lean();
      if (!card) return res.status(404).send('Visiting card not found for this profile');
    } else {
      return res.status(400).send('Missing visiting card identifier');
    }

    if (!req.user || !req.user._id) return res.status(401).send('Authentication required');
  const isOwner = (card.user && String(card.user) === String(req.user._id)) || (card.profileSlug && profile && profile.user && String(profile.user) === String(req.user._id));
    const hasElevatedRole = req.user.role === 'admin' || req.user.isAdmin;
    if (!isOwner && !hasElevatedRole) return res.status(403).send('Forbidden');

    const { token: csrfToken, generationError } = getCsrfToken(req, res);
    const slugVal = req.params ? req.params.slug : (req.user && req.user.slug) || '';
  // pass profile and card; views will prefer profile data for contact/name/image
  const renderOpts = { profile, user: req.user, slug: slugVal, csrfToken, card, layout: 'layouts/dashboard-boilerplate' };
    if (generationError) renderOpts.error = 'Unable to generate security token for this form. Please try again.';

    res.render('visiting-cards/edit', renderOpts);
  } catch (err) {
    console.error('Error rendering edit visiting card form', err);
    res.status(500).send('Error rendering form');
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).send('Authentication required');
    }

    const id = req.params.id;
  const updates = req.body || {};
  const card = await VisitingCard.findById(id);
    if (!card) return res.status(404).send('Visiting card not found');

    const isOwner = card.user && String(card.user) === String(req.user._id);
    let profileForCard = null;
    if (!isOwner && card.profileSlug) {
      profileForCard = await Profile.findOne({ slug: card.profileSlug }).lean();
      if (profileForCard && profileForCard.user && String(profileForCard.user) === String(req.user._id)) {
      }
    }
    const hasElevatedRole = req.user.role === 'admin' || req.user.isAdmin;
    const allowedToEdit = isOwner || (profileForCard && profileForCard.user && String(profileForCard.user) === String(req.user._id)) || hasElevatedRole;
    if (!allowedToEdit) return res.status(403).send('Unauthorized to update this card');

  // Only allow card-specific fields to be updated; profile holds contact data
  const allowed = ['title', 'description', 'website'];
  allowed.forEach(k => { if (updates[k] !== undefined) card[k] = updates[k]; });

  if (updates.profileSlug !== undefined) {
      if (updates.profileSlug) {
        const newProfile = await Profile.findOne({ slug: updates.profileSlug }).lean();
        if (!newProfile) return res.status(400).send('Invalid profile slug');
        if (!(req.user.role === 'admin' || req.user.isAdmin) && newProfile.user && String(newProfile.user) !== String(req.user._id)) {
          return res.status(403).send('Forbidden: you do not own the profile you are assigning');
        }
  card.profileSlug = updates.profileSlug;
      } else {
        card.profileSlug = undefined;
      }
    }

    await card.save();
    // determine redirect target: prefer profile slug, then request slug, then user slug
    let redirectSlug = req.params.slug || (req.user && req.user.slug) || '';
    if (card.profileSlug && !redirectSlug) {
      redirectSlug = card.profileSlug;
    }
    const redirectTo = (redirectSlug && `/dashboard/${redirectSlug}/visiting-cards`) || '/dashboard';
    if (req.xhr || (req.headers['accept'] || '').includes('application/json')) return res.json({ ok: true, card });
    res.redirect(redirectTo);
  } catch (err) {
    console.error('Error updating visiting card', { error: err && (err.stack || err.message || err), userId: req.user && req.user._id ? String(req.user._id) : null });
    res.status(500).send('Error updating visiting card');
  }
};

// Delete visiting card
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send('Visiting card ID required');

    // Load the card first
    const card = await VisitingCard.findById(id).lean();
    if (!card) return res.status(404).send('Visiting card not found');

    // Require authentication
    if (!req.user || !req.user._id) return res.status(401).send('Authentication required');

    // Authorization: owner (card.user) or profile owner or admin
    const isOwner = card.user && String(card.user) === String(req.user._id);
    let profileOwnerMatch = false;
    if (!isOwner && card.profileSlug) {
      const profile = await Profile.findOne({ slug: card.profileSlug }).lean();
      if (profile && profile.user && String(profile.user) === String(req.user._id)) profileOwnerMatch = true;
    }
    const hasElevatedRole = req.user.role === 'admin' || req.user.isAdmin;
    if (!isOwner && !profileOwnerMatch && !hasElevatedRole) {
      return res.status(403).send('Forbidden');
    }

    // Authorized: perform delete
    await VisitingCard.findByIdAndDelete(id);

  const slug = req.params.slug || (req.user && req.user.slug) || '';
  const redirectTo = (slug && `/dashboard/${slug}/visiting-cards`) || '/dashboard';
    res.redirect(redirectTo);
  } catch (err) {
    console.error('Error deleting visiting card', { error: err && (err.stack || err.message || err), userId: req.user && req.user._id ? String(req.user._id) : null });
    res.status(500).send('Error deleting visiting card');
  }
};
// (file ends)
