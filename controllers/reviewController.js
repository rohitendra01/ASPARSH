const ReviewLink = require('../models/ReviewLink');
const Profile = require('../models/Profile');
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

    const { 
      profileSlug, 
      targetUrl, 
      reviewTitle, 
      businessName,
      businessSubheader,
      businessCategory 
    } = req.body; 

    if (!profileSlug || !targetUrl || !businessName || !businessCategory) {
      return res.status(400).json({ error: 'Missing required fields: profileSlug, targetUrl, businessName, and businessCategory' });
    }

    const profile = await Profile.findOne({ slug: profileSlug }).select('_id slug').lean(); 
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const slug = await generateUniqueSlug(profileSlug);
    
    const reviewLinkData = {
      profileSlug: profile.slug,
      profileId: profile._id,
      slug,
      targetUrl,
      reviewTitle: reviewTitle || 'Share Your Experience',
      isActive: true, 
      createdBy: req.user._id,

      businessName: businessName,
      businessSubheader: businessSubheader,
      businessCategory: businessCategory
    };

    const reviewLink = new ReviewLink(reviewLinkData);
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
    const reviewLinks = await ReviewLink.find({})
      .sort({ createdAt: -1 })
      .lean();
      
    const slug = req.params.slug || (req.user ? req.user.slug : '');

    res.render('reviews/index', {
      profile: null,
      reviewLinks, 
      slug: slug,
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

    const profile = await Profile.findOne({ _id: reviewLink.profileId }).lean();
    if (!profile) {
        return res.status(500).render('error', { message: 'Linked profile not found' });
    }
    
    const city = profile.address?.city; //
    
    await ReviewLink.findByIdAndUpdate(reviewLink._id, { $inc: { viewCount: 1 } });
    
    res.render('reviews/show', {
      link: {
        slug: reviewLink.slug,
        title: reviewLink.reviewTitle,
        targetUrl: reviewLink.targetUrl
      },
      business: {
        name: reviewLink.businessName,
        category: reviewLink.businessCategory,
        subcategory: null,
        city: city
      },
      layout: 'layouts/boilerplate'
    });
  } catch (err) {
    console.error('Error loading public review page:', err);
    res.status(500).render('error', { message: 'Error loading page' });
  }
};

// Generate review 
exports.generate = async (req, res) => {
  try {
    const slug = req.params.slug;

    const reviewLink = await ReviewLink.findOneAndUpdate(
      { slug, isActive: true }, 
      { $inc: { generationCount: 1 } },
      { new: true }
    ).lean(); 
    
    if (!reviewLink) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const profile = await Profile.findOne({ _id: reviewLink.profileId }).select('address.city').lean();
    if (!profile) {
        return res.status(500).json({ error: 'Linked profile not found for location data' });
    }
    
    const city = profile.address?.city || 'this area';
    const businessName = reviewLink.businessName;
    const category = reviewLink.businessCategory;
    const subheader = reviewLink.businessSubheader;

    const promptStyles = [
        {
            // Style 1: The "Low Effort"
            system: `You are a customer writing a 3-7 word review for ${businessName} in ${city}. Your review is extremely short, positive, and to the point. **Do not use any markdown, bolding, or special formatting.**`,
            user: `Generate a 3-7 word positive review (e.g., "Good service.", "Best in ${city}.", "Loved it."). **Plain text only, no markdown.**`
        },
        {
            // Style 2: The Professional
            system: `You are a professional critic reviewing ${businessName} (a ${category}) in ${city}. Your review is articulate and sophisticated. **You must not use any markdown, bolding, or asterisks.**`,
            user: `Generate a 10-30 word professional review. Focus on the unique aspects and why it's a "must-visit" in ${city}. **Write in plain text only.**`
        },
        {
            // Style 3: The "Smart Local" (Hinglish/Spanglish etc.)
            system: `You are a local resident of ${city}. You are writing a casual review for ${businessName}. You MUST mix in 2-3 common slang words from the local language of ${city} (e.g., for an Indian city, use Hinglish like 'mast' or 'badiya'). The review should be mostly English, but with clear local flavor. **Crucially, do NOT use any markdown, bolding, or asterisks.**`,
            user: `Generate a 2-10 word review that is mostly English but has 2-3 local slang words for ${city} mixed in. **Write in plain text only. Do not use formatting like **.**`
        },
        {
            // Style 4: The Enthusiast
            system: `You are an enthusiastic friend recommending ${businessName} in ${city}. Your tone is excited and informal. You can use exclamation points and one word in ALL-CAPS, but **no markdown, bolding, or asterisks.**`,
            user: `Generate a 15-30 word ENTHUSIASTIC review for ${businessName}. Use at least one exclamation mark! **Write in plain text only.**`
        },
        {
            // Style 5: The "Quick Typo"
            system: `You are a regular person reviewing ${businessName} in ${city} quickly on your phone. You are positive, but make one or two small, believable typos (e.g., "teh", "realy"). Keep it subtle. **Do not use any markdown or special formatting.**`,
            user: `Generate a 10-30 word positive review. Write it as if you are typing quickly and make a small, natural typo. **Plain text only, no markdown.**`
        },
        {
            // Style 6: The Skeptic
            system: `You are a customer reviewing ${businessName} in ${city}. You were skeptical at first but were won over. Your review should sound pleasantly surprised. **Do not use any markdown, bolding, or asterisks.**`,
            user: `Generate a 10-20 word review for ${businessName} that starts slightly skeptical but ends very positively. **Plain text only.**`
        },
        {
            // Style 7: The "Full Local"
            system: `You are a local resident of ${city}. You are writing an informal review for ${businessName} almost ENTIRELY in the local mixed language (e.g., for ${city}, India, write in Hinglish). Do not use much proper English.Use writing in local languae also. **You must not use any markdown, bolding, or formatting.**`,
            user: `Generate a 10-25 word review in this very casual, local mixed-language style (like Hinglish). Be specific to ${businessName}. **Do not use any formatting like **.**`
        },
        {
            // Style 8: The "Short Local"
            system: `You are a local resident of ${city}. You are writing a VERY short review for ${businessName}, almost entirely in the local slang (e.g., "Bahut badhiya!", "Mast service hai bhai", "Paisa vasool!").Use writing in local languae also. **No markdown or formatting allowed.**`,
            user: `Generate a 3-7 word review for ${businessName} in the local mixed-language of ${city} (like Hinglish). **Plain text only.**`
        },
        {
            // Style 9: The "Excited Newcomer"
            system: `You are new to ${city} and just visited ${businessName}. You are excited about your experience and want to share it. Use writing in local languae also. **Do not use any markdown or asterisks.**`,
            user: `Generate a 15-30 word review for ${businessName} that conveys excitement about discovering it in ${city}. **Plain text only.**`
        },
        {
            // Style 10: The "True Local"
            system: `You are a true local of ${city}. Your review for ${businessName} is deeply rooted in the local culture and language.Use writing in local languae also. **You must not use any markdown, bolding, or formatting.**`,
            user: `Generate a 10-25 word review for ${businessName} that showcases your deep local knowledge. **Plain text only, no markdown.**`
        }
    ];

    const selectedStyle = promptStyles[Math.floor(Math.random() * promptStyles.length)];
    
    let systemPrompt = reviewLink.customPromptTemplate 
        ? reviewLink.customPromptTemplate 
        : selectedStyle.system;            

    const userPrompt = selectedStyle.user;
    
    if (subheader) {
        systemPrompt = `The business, ${businessName}, also specializes in ${subheader}. ${systemPrompt}`;
    }

    const reviewText = await generateReviewText(systemPrompt, userPrompt); 

    await ReviewLink.findByIdAndUpdate(
      reviewLink._id,
      {
        $push: {
          generatedReviews: {
            text: reviewText,
            category: reviewLink.businessCategory,
            generatedAt: new Date()
          }
        },
        $slice: { generatedReviews: -10 }
      }
    );

    res.json({
      success: true,
      reviewText,
      category: reviewLink.businessCategory
    });
  } catch (err) {
    console.error('Error generating review:', err);
    res.status(500).json({ error: 'Failed to generate review', details: err.message });
  }
};

// Submit review
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