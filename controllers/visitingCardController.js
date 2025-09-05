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
    // Log the error with contextual information but do not leak sensitive data to the client.
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
    const rawProfileId = body.profileId;
    let profile = null;
    let profileObjectId;
    let profileImage;

    // If profileId is provided, validate it and ensure ownership
    if (rawProfileId) {
      if (!mongoose.Types.ObjectId.isValid(rawProfileId)) {
        return res.status(400).json({ error: 'Invalid profileId' });
      }
      profileObjectId = new mongoose.Types.ObjectId(rawProfileId);
      profile = await Profile.findById(profileObjectId).lean();
      if (!profile) return res.status(404).json({ error: 'Profile not found' });

      // Verify profile ownership: profile.user (owner) must match current user
      const profileOwner = profile.user || profile.owner || null;
      if (profileOwner && String(profileOwner) !== String(req.user._id)) {
        console.warn('Unauthorized profile access attempt', { profileId: String(profileObjectId), attemptedBy: String(req.user._id) });
        return res.status(403).json({ error: 'Forbidden: you do not own the specified profile' });
      }

      profileImage = profile.image || undefined;
    }

    // Extract fields safely from body
    let {
      slug,
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
      instagram,
      image
    } = body;

    // If profile exists, use profile values as safe fallbacks
    if (profile) {
      name = (typeof name === 'string' && name.trim()) ? name.trim() : (profile.name || undefined);
      email = (typeof email === 'string' && email.trim()) ? email.trim() : (profile.email || undefined);
      phone = (typeof phone === 'string' && phone.trim()) ? phone.trim() : (profile.mobile || undefined);
      address = (typeof address === 'string' && address.trim()) ? address.trim() : (profile.address && profile.address.addressLine ? profile.address.addressLine : undefined);
    } else {
      name = typeof name === 'string' ? name.trim() : name;
      email = typeof email === 'string' ? email.trim() : email;
      phone = typeof phone === 'string' ? phone.trim() : phone;
      address = typeof address === 'string' ? address.trim() : address;
    }

    title = typeof title === 'string' ? title.trim() : title;
    description = typeof description === 'string' ? description.trim() : description;

    // Validate required fields
    const validationErrors = [];
    if (!title) validationErrors.push({ field: 'title', message: 'Title is required' });
    if (!name) validationErrors.push({ field: 'name', message: 'Name is required' });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Slug sanitization: allow only lowercase letters, numbers and hyphens
    if (slug) {
      slug = slug.toLowerCase();
      const slugPattern = /^[a-z0-9-]+$/;
      if (!slugPattern.test(slug)) {
        return res.status(400).json({ error: 'Invalid slug. Use only lowercase letters, numbers, and hyphens.' });
      }
    }

    // Build visiting card with safe, validated values
    const visitingCard = new VisitingCard({
      user: req.user._id,
      profileId: profileObjectId || undefined,
      slug: slug || undefined,
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
      instagram,
      image: image || profileImage
    });

    await visitingCard.save();

    const redirectTo = (slug && `/dashboard/${slug}/visiting-cards`) || (req.user && req.user.slug ? `/dashboard/${req.user.slug}/visiting-cards` : '/dashboard');
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
    const visitingCard = await VisitingCard.findOne({ profileId: profile._id }).sort({ createdAt: -1 });
    if (!visitingCard) return res.status(404).send('Visiting card not found for this profile');
    res.render('visiting-cards/show', { card: visitingCard });
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
        // show cards linked to this profile OR cards created by the logged-in user
        if (req.user && req.user._id) {
          filters.push({ $or: [ { profileId: profile._id }, { user: req.user._id } ] });
        } else {
          filters.push({ profileId: profile._id });
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
    const cards = await VisitingCard.find(query).lean();
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
      if (card.profileId) profile = await Profile.findById(card.profileId).lean();
    } else if (maybeProfileSlug) {
      profile = await Profile.findOne({ slug: maybeProfileSlug }).lean();
      if (!profile) return res.status(404).send('Profile not found');
      card = await VisitingCard.findOne({ profileId: profile._id }).sort({ createdAt: -1 }).lean();
      if (!card) return res.status(404).send('Visiting card not found for this profile');
    } else {
      return res.status(400).send('Missing visiting card identifier');
    }

    if (!req.user || !req.user._id) return res.status(401).send('Authentication required');
    const isOwner = (card.user && String(card.user) === String(req.user._id)) || (card.profileId && profile && profile.user && String(profile.user) === String(req.user._id));
    const hasElevatedRole = req.user.role === 'admin' || req.user.isAdmin;
    if (!isOwner && !hasElevatedRole) return res.status(403).send('Forbidden');

    const { token: csrfToken, generationError } = getCsrfToken(req, res);
    const slugVal = req.params ? req.params.slug : (req.user && req.user.slug) || '';
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
    if (!isOwner && card.profileId) {
      if (mongoose.Types.ObjectId.isValid(card.profileId)) {
        profileForCard = await Profile.findById(card.profileId).lean();
        if (profileForCard && profileForCard.user && String(profileForCard.user) === String(req.user._id)) {
        }
      }
    }
    const hasElevatedRole = req.user.role === 'admin' || req.user.isAdmin;
    const allowedToEdit = isOwner || (profileForCard && profileForCard.user && String(profileForCard.user) === String(req.user._id)) || hasElevatedRole;
    if (!allowedToEdit) return res.status(403).send('Unauthorized to update this card');

    const allowed = ['name', 'title', 'description', 'email', 'phone', 'address', 'website', 'linkedin', 'twitter', 'facebook', 'instagram', 'slug', 'image'];
    allowed.forEach(k => { if (updates[k] !== undefined) card[k] = updates[k]; });

    if (updates.profileId !== undefined) {
      if (updates.profileId) {
        if (!mongoose.Types.ObjectId.isValid(updates.profileId)) {
          return res.status(400).send('Invalid profile ID');
        }
        const newProfile = await Profile.findById(updates.profileId).lean();
        if (!newProfile) return res.status(400).send('Invalid profile ID');
        if (!(req.user.role === 'admin' || req.user.isAdmin) && newProfile.user && String(newProfile.user) !== String(req.user._id)) {
          return res.status(403).send('Forbidden: you do not own the profile you are assigning');
        }
  card.profileId = new mongoose.Types.ObjectId(updates.profileId);
      } else {
        card.profileId = undefined;
      }
    }

    await card.save();
    const slug = updates.slug || req.params.slug || (req.user && req.user.slug) || card.slug;
    const redirectTo = (slug && `/dashboard/${slug}/visiting-cards`) || '/dashboard';
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
    if (!isOwner && card.profileId && mongoose.Types.ObjectId.isValid(card.profileId)) {
      const profile = await Profile.findById(card.profileId).lean();
      if (profile && profile.user && String(profile.user) === String(req.user._id)) profileOwnerMatch = true;
    }
    const hasElevatedRole = req.user.role === 'admin' || req.user.isAdmin;
    if (!isOwner && !profileOwnerMatch && !hasElevatedRole) {
      return res.status(403).send('Forbidden');
    }

    // Authorized: perform delete
    await VisitingCard.findByIdAndDelete(id);

    const slug = req.params.slug || (req.user && req.user.slug) || (card && card.slug) || '';
    const redirectTo = (slug && `/dashboard/${slug}/visiting-cards`) || '/dashboard';
    res.redirect(redirectTo);
  } catch (err) {
    console.error('Error deleting visiting card', { error: err && (err.stack || err.message || err), userId: req.user && req.user._id ? String(req.user._id) : null });
    res.status(500).send('Error deleting visiting card');
  }
};
// (file ends)
