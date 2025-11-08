const ReviewLink = require('../models/ReviewLink');
const Profile = require('../models/Profile');
const { getPromptTemplate } = require('../services/categoryPrompts');
const { generateReviewText } = require('../services/aiService');

// Helper to extract CSRF token
const getCsrfToken = (req, res) => {
  let token;
  if (typeof req.csrfToken === 'function') {
    try {
      token = req.csrfToken();
    } catch (e) {
      console.error('CSRF token generation failed:', e.message);
    }
  }
  if (!token && res && res.locals && res.locals.csrfToken) token = res.locals.csrfToken;
  return token;
};

// Helper to validate slug format
const isValidSlug = (s) => {
  if (!s || typeof s !== 'string') return false;
  const slug = s.trim();
  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
  return SLUG_REGEX.test(slug);
};

// Render form to create review link
exports.renderNewForm = async (req, res) => {
  try {
    let profile = null;
    let slug = '';
    
    const profileSlug = req.params && req.params.slug;
    
    if (profileSlug && isValidSlug(profileSlug)) {
      profile = await Profile.findOne({ slug: profileSlug }).lean();
      if (!profile) {
        return res.status(404).send('Profile not found');
      }
      slug = profileSlug;
    } else if (req.user && req.user.slug) {
      slug = req.user.slug;
    }
    
    const csrfToken = getCsrfToken(req, res);
    
    res.render('reviews/new', {
      profile,
      slug,
      csrfToken,
      layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    console.error('Error rendering review link form:', err);
    res.status(500).send('Error rendering form');
  }
};

// Search profiles endpoint
exports.searchProfiles = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.json({ profiles: [] });
    }

    const searchQuery = q.trim();
    
    const profiles = await Profile.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { slug: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } }
      ]
    })
      .select('_id name slug category subcategory occupation')
      .limit(10)
      .lean();

    console.log('[Search] Query:', searchQuery, '| Found:', profiles.length);
    res.json({ profiles });
  } catch (err) {
    console.error('Error searching profiles:', err);
    res.status(500).json({ error: 'Failed to search profiles' });
  }
};

// Generate unique slug
const generateUniqueSlug = async (profileSlug) => {
  const randomHash = Math.random().toString(36).substring(2, 7);
  let uniqueSlug = profileSlug + '-' + randomHash;
  let exists = await ReviewLink.exists({ slug: uniqueSlug });
  
  while (exists) {
    const newRandomHash = Math.random().toString(36).substring(2, 7);
    uniqueSlug = profileSlug + '-' + newRandomHash;
    exists = await ReviewLink.exists({ slug: uniqueSlug });
  }
  
  return uniqueSlug;
};

// Create review link
exports.create = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { profileSlug, linkType, googleReviewUrl, customFormUrl, reviewTitle } = req.body;

    if (!profileSlug || !linkType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const profile = await Profile.findOne({ slug: profileSlug });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const slug = await generateUniqueSlug(profileSlug);
    
    const reviewLink = new ReviewLink({
      createdBy: req.user._id,
      profileSlug: profile.slug,
      profileId: profile._id,
      slug,
      linkType,
      googleReviewUrl: linkType === 'google_review' ? googleReviewUrl : null,
      customFormUrl: linkType === 'custom_form' ? customFormUrl : null,
      reviewTitle: reviewTitle || 'Share Your Experience',
      isActive: true,
      profileDetails: {
        name: profile.name,
        category: profile.category,
        subcategory: profile.subcategory,
        occupation: profile.occupation
      }
    });

    if (linkType === 'google_review' && googleReviewUrl) {
      const placeIdMatch = googleReviewUrl.match(/placeid=([^&]+)/);
      if (placeIdMatch) {
        reviewLink.googlePlaceId = placeIdMatch[1];
      }
    }

    await reviewLink.save();

    const publicUrl = req.protocol + '://' + req.get('host') + '/reviews/' + slug;

    if (req.xhr || (req.headers['accept'] || '').includes('application/json')) {
      return res.json({ ok: true, reviewLink, publicUrl, profileSlug });
    }

    res.redirect('/dashboard/' + profileSlug + '/reviews');
  } catch (err) {
    console.error('Error creating review link:', err);
    res.status(500).json({ error: 'Failed to create review link', details: err.message });
  }
};

// List review links for a profile
exports.list = async (req, res) => {
  try {
    const profileSlug = req.params.slug;

    if (!profileSlug) {
      return res.status(400).send('Missing profile slug');
    }

    const profile = await Profile.findOne({ slug: profileSlug }).lean();
    if (!profile) {
      return res.status(404).send('Profile not found');
    }

    const reviewLinks = await ReviewLink.find({ profileSlug })
      .sort({ createdAt: -1 })
      .lean();

    res.render('reviews/index', {
      profile,
      reviewLinks,
      slug: profileSlug,
      csrfToken: getCsrfToken(req, res),
      layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    console.error('Error listing review links:', err);
    res.status(500).send('Error loading review links');
  }
};

// Show public review page
exports.show = async (req, res) => {
  try {
    const slug = req.params.slug;

    const reviewLink = await ReviewLink.findOne({
      slug: slug,
      isActive: true
    }).lean();

    if (!reviewLink) {
      return res.status(404).render('error', {
        message: 'Review link not found or inactive',
        layout: 'layouts/boilerplate'
      });
    }


    // Increment view count
    await ReviewLink.findByIdAndUpdate(reviewLink._id, { $inc: { viewCount: 1 } });

    const promptTemplate = getPromptTemplate(
      reviewLink.profileDetails.category,
      reviewLink.profileDetails.subcategory
    );

    res.render('reviews/show', {
      link: {
        slug,
        title: reviewLink.reviewTitle,
        type: reviewLink.linkType,
        googlePlaceId: reviewLink.googlePlaceId,
        customFormUrl: reviewLink.customFormUrl
      },
      business: {
        name: reviewLink.profileDetails.name,
        category: reviewLink.profileDetails.category,
        subcategory: reviewLink.profileDetails.subcategory
      },
      promptTemplate,
      layout: 'layouts/boilerplate'
    });
  } catch (err) {
    console.error('Error loading public review page:', err);
    res.status(500).render('error', { message: 'Error loading page' });
  }
};

// Generate review (AJAX) - THIS IS WHERE THE 404 ERROR COMES FROM
exports.generate = async (req, res) => {
  try {
    const slug = req.params.slug;

    const reviewLink = await ReviewLink.findOne({ slug, isActive: true });
    
    if (!reviewLink) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const promptTemplate = getPromptTemplate(
      reviewLink.profileDetails.category,
      reviewLink.profileDetails.subcategory
    );

    const systemPrompt = reviewLink.customPromptTemplate || promptTemplate.system;
    const userPrompt = promptTemplate.template;
    
    const reviewText = await generateReviewText(systemPrompt, userPrompt);

    await ReviewLink.findByIdAndUpdate(
      reviewLink._id,
      {
        $inc: { generationCount: 1 },
        $push: {
          generatedReviews: {
            text: reviewText,
            category: reviewLink.profileDetails.category,
            generatedAt: new Date()
          }
        },
        $slice: { generatedReviews: -10 }
      }
    );

    res.json({
      success: true,
      reviewText,
      category: reviewLink.profileDetails.category
    });
  } catch (err) {
    console.error('Error generating review:', err);
    res.status(500).json({ error: 'Failed to generate review', details: err.message });
  }
};

// Submit review (AJAX tracking)
exports.submit = async (req, res) => {
  try {
    const slug = req.params.slug;
    const reviewText = req.body.reviewText;

    if (!slug || !reviewText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reviewLink = await ReviewLink.findOne({ slug });
    if (!reviewLink) {
      return res.status(404).json({ error: 'Link not found' });
    }

    await ReviewLink.findByIdAndUpdate(reviewLink._id, { $inc: { submissionCount: 1 } });
    
    res.json({ success: true, message: 'Submission tracked' });
  } catch (err) {
    console.error('Error tracking submission:', err);
    res.status(500).json({ error: 'Failed to track submission' });
  }
};

// Delete review link
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const profileSlug = req.params.slug;

    if (!id) return res.status(400).send('Missing review link ID');

    const link = await ReviewLink.findById(id);
    if (!link) {
      return res.status(404).send('Link not found');
    }

    await ReviewLink.findByIdAndDelete(id);

    const redirectTo = profileSlug
      ? '/dashboard/' + profileSlug + '/reviews'
      : '/dashboard';

    res.redirect(redirectTo);
  } catch (err) {
    console.error('Error deleting review link:', err);
    res.status(500).send('Failed to delete review link');
  }
};