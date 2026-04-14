const reviewService = require('../services/reviewService');
const profileRepository = require('../repositories/profileRepository');

const getCsrfToken = (req, res) => {
  try { if (typeof req.csrfToken === 'function') return req.csrfToken(); } catch (e) { }
  return res?.locals?.csrfToken || null;
};

const isValidSlug = (s) => typeof s === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(s.trim());

exports.renderNewForm = async (req, res) => {
  try {
    const profileSlug = req.params?.slug;
    let profile = null;
    let slug = req.user?.slug || '';

    if (profileSlug && isValidSlug(profileSlug)) {
      // findProfileDocumentBySlugAndTenant now ignores tenantId — any profile is accessible
      profile = await profileRepository.findProfileDocumentBySlugAndTenant(profileSlug, null);
      if (!profile) return res.status(404).send('Profile not found');
      slug = profileSlug;
    }

    res.render('reviews/new', { profile, slug, csrfToken: getCsrfToken(req, res), layout: 'layouts/dashboard-boilerplate' });
  } catch (err) {
    res.status(500).send('Error rendering form');
  }
};

exports.searchProfiles = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 1) return res.json({ profiles: [] });

    const profiles = await profileRepository.findAllProfiles(q, 10);

    res.json({ profiles: profiles.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search profiles' });
  }
};

exports.create = async (req, res) => {
  try {
    const { profileSlug, targetUrl, businessName, businessCategory } = req.body;
    if (!profileSlug || !targetUrl || !businessName || !businessCategory) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { reviewLink, slug } = await reviewService.processReviewCreation(req.body, req.user._id);
    const publicUrl = `${req.protocol}://${req.get('host')}/reviews/${slug}`;

    if (req.xhr || (req.headers['accept'] || '').includes('application/json')) {
      return res.json({ ok: true, reviewLink, publicUrl, profileSlug });
    }
    res.redirect(`/dashboard/${profileSlug}/reviews`);
  } catch (err) {
    res.status(err.message === 'Profile not found' ? 404 : 500).json({ error: 'Failed to create review link', details: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const reviewLinks = await require('../repositories/reviewRepository').listReviewsByTenant(null);
    res.render('reviews/index', {
      profile: null, reviewLinks, slug: req.params.slug || req.user?.slug || '',
      csrfToken: getCsrfToken(req, res), layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    res.status(500).send('Error loading review links');
  }
};

exports.show = async (req, res) => {
  try {
    const { reviewLink, city } = await reviewService.getPublicReviewData(req.params.slug);

    res.render('reviews/show', {
      link: { slug: reviewLink.slug, title: reviewLink.reviewTitle, targetUrl: reviewLink.targetUrl },
      business: { name: reviewLink.businessName, category: reviewLink.businessCategory, subcategory: null, city },
      layout: 'layouts/boilerplate'
    });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).render('error', { message: err.message, layout: 'layouts/boilerplate' });
  }
};

exports.generate = async (req, res) => {
  try {
    const result = await reviewService.processAiReviewGeneration(req.params.slug);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: 'Failed to generate review', details: err.message });
  }
};

exports.submit = async (req, res) => {
  try {
    if (!req.params.slug || !req.body.reviewText) return res.status(400).json({ error: 'Missing required fields' });
    await reviewService.trackReviewSubmission(req.params.slug);
    res.json({ success: true, message: 'Submission tracked' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to track submission' });
  }
};

exports.delete = async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).send('Missing review link ID');
    await require('../repositories/reviewRepository').softDeleteReviewLink(req.params.id, null);
    res.redirect(req.params.slug ? `/dashboard/${req.params.slug}/reviews` : '/dashboard');
  } catch (err) {
    res.status(500).send('Failed to delete review link');
  }
};