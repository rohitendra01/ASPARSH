const VisitingCard = require('../models/VisitingCard');
const Profile = require('../models/Profile');

// Render new visiting card form
exports.renderNewForm = async (req, res) => {
  try {
    let profile = null;
    if (req.params && req.params.slug) profile = await Profile.findOne({ slug: req.params.slug });
    let csrfToken;
    try { if (typeof req.csrfToken === 'function') csrfToken = req.csrfToken(); } catch (e) {}
    if (!csrfToken && res && res.locals && res.locals.csrfToken) csrfToken = res.locals.csrfToken;
    return res.render('visiting-cards/new', { profile, user: req.user, slug: req.params ? req.params.slug : (req.user && req.user.slug) || '', csrfToken, layout: 'layouts/dashboard-boilerplate' });
  } catch (err) {
    console.error('Error rendering visiting card form', err);
    res.status(500).send('Error rendering form');
  }
};

// Create visiting card
exports.create = async (req, res) => {
  try {
    const { title, description, website, linkedin, twitter, facebook, instagram, image, profileId, slug } = req.body;
    let name, email, phone, address, profileImage;
    if (profileId) {
      const profile = await Profile.findById(profileId).lean();
      if (profile) {
        name = profile.name || undefined;
        email = profile.email || undefined;
        phone = profile.mobile || undefined;
        address = profile.address && profile.address.addressLine ? profile.address.addressLine : undefined;
        profileImage = profile.image || undefined;
      }
    }
    // Allow overriding by request body if provided (rare, since form no longer sends them)
    name = req.body.name || name;
    email = req.body.email || email;
    phone = req.body.phone || phone;
    address = req.body.address || address;
    const visitingCard = new VisitingCard({
      user: req.user ? req.user._id : undefined,
      profileId: profileId || undefined,
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
    console.error(err);
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

// Render edit form
exports.renderEditForm = async (req, res) => {
  try {
    const id = req.params.id;
    const card = await VisitingCard.findById(id).lean();
    if (!card) return res.status(404).send('Visiting card not found');
    let profile = null;
    if (card.profileId) profile = await Profile.findById(card.profileId).lean();
    let csrfToken;
    try { if (typeof req.csrfToken === 'function') csrfToken = req.csrfToken(); } catch (e) {}
    if (!csrfToken && res && res.locals && res.locals.csrfToken) csrfToken = res.locals.csrfToken;
    res.render('visiting-cards/new', { profile, user: req.user, slug: req.params ? req.params.slug : (req.user && req.user.slug) || '', csrfToken, card, layout: 'layouts/dashboard-boilerplate' });
  } catch (err) {
    console.error('Error rendering edit visiting card form', err);
    res.status(500).send('Error rendering form');
  }
};

// Update visiting card
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body || {};
    const card = await VisitingCard.findById(id);
    if (!card) return res.status(404).send('Visiting card not found');
  const allowed = ['name','title','description','email','phone','address','website','linkedin','twitter','facebook','instagram','slug','image'];
    allowed.forEach(k => { if (updates[k] !== undefined) card[k] = updates[k]; });
    if (updates.profileId !== undefined) card.profileId = updates.profileId || undefined;
    await card.save();
    const slug = updates.slug || req.params.slug || (req.user && req.user.slug) || card.slug;
    const redirectTo = (slug && `/dashboard/${slug}/visiting-cards`) || '/dashboard';
    if (req.xhr || (req.headers['accept'] || '').includes('application/json')) return res.json({ ok: true, card });
    res.redirect(redirectTo);
  } catch (err) {
    console.error('Error updating visiting card', err);
    res.status(500).send('Error updating visiting card');
  }
};

// Delete visiting card
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const card = await VisitingCard.findByIdAndDelete(id);
    const slug = req.params.slug || (req.user && req.user.slug) || (card && card.slug) || '';
    const redirectTo = (slug && `/dashboard/${slug}/visiting-cards`) || '/dashboard';
    res.redirect(redirectTo);
  } catch (err) {
    console.error('Error deleting visiting card', err);
    res.status(500).send('Error deleting visiting card');
  }
};
