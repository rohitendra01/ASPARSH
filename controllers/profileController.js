const Profile = require('../models/Profile');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Render new profile form
exports.renderNewProfileForm = (req, res) => {
  res.render('profiles/new', { userSlug: req.params.slug });
};

// Handle profile creation
exports.createProfile = async (req, res) => {
  try {

    // Destructure known fields, but do not destructure socialLinks yet
    const {
      name,
      email,
      mobile,
      addressLine,
      country,
      city,
      postcode
    } = req.body;

    // Robustly extract socialLinks from req.body
    let socialLinksRaw = req.body.socialLinks;
    let socialLinksArr = [];
    if (typeof socialLinksRaw === 'string') {
      // If sent as JSON string (e.g., via AJAX or single field)
      try {
        socialLinksRaw = JSON.parse(socialLinksRaw);
      } catch (e) {
        // If not JSON, treat as single link type (not expected, but fallback)
        socialLinksRaw = undefined;
      }
    }
    if (Array.isArray(socialLinksRaw)) {
      socialLinksArr = socialLinksRaw.filter(link => link && link.type && link.url);
    } else if (typeof socialLinksRaw === 'object' && socialLinksRaw !== null) {
      // If only one link, it comes as an object, or if it's an object with numeric keys
      if (socialLinksRaw.type && socialLinksRaw.url) {
        socialLinksArr = [socialLinksRaw];
      } else {
        // Convert object with numeric keys to array
        socialLinksArr = Object.values(socialLinksRaw).filter(link => link && link.type && link.url);
      }
    } else {
      // If undefined, null, or empty, leave as empty array
      socialLinksArr = [];
    }
    console.log('socialLinks raw:', req.body.socialLinks);
    console.log('socialLinksArr:', socialLinksArr);

    let imageUrl = '';
    if (req.file) {
      try {
        imageUrl = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({
            folder: 'asparsh/profiles',
            resource_type: 'image',
            public_id: `profile_${Date.now()}`,
            overwrite: true
          }, (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          });
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      } catch (cloudErr) {
        console.error('Image upload failed:', cloudErr);
        req.flash('error_msg', 'Image upload failed. Please try again.');
        return res.redirect(`/dashboard/${req.params.slug}/profiles/new`);
      }
    }


    // Auto-generate slug from name
    const slug = name ? name.trim().toLowerCase().replace(/\s+/g, '-') : '';

    // Validate that at least one social link is provided
    if (socialLinksArr.length === 0) {
      req.flash('error_msg', 'Please add at least one social link.');
      return res.redirect(`/dashboard/${req.params.slug}/profiles/new`);
    }

    const profile = new Profile({
      createdBy: req.user._id,
      name,
      email,
      image: imageUrl,
      mobile,
      address: {
        addressLine,
        country,
        city,
        postcode
      },
      socialLinks: socialLinksArr,
      slug
    });
    await profile.save();
    req.flash('success_msg', 'Profile created successfully!');
    // Redirect directly to the new profile's page
    return res.redirect(`/dashboard/${req.params.slug}/profiles`);
  } catch (err) {
    console.error('Error creating profile:', err);
    req.flash('error_msg', 'Error creating profile. Please try again.');
    res.redirect(`/dashboard/${req.params.slug}/profiles`);
  }
};

// List all profiles for the current user
exports.listProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({});
    const slug = req.user.slug;
    res.render('profiles/index', { profiles, userSlug: slug, slug });
  } catch (err) {
    console.error('Error loading profiles:', err);
    const slug = req.user.slug;
    res.render('profiles/index', { profiles: [], userSlug: slug, slug });
  }
};

// Render profile details
exports.showProfile = async (req, res) => {
  try {
    // Find profile by slug (public for dashboard)
    const profile = await Profile.findOne({ slug: req.params.profileSlug });
    if (!profile) {
      req.flash('error_msg', 'Profile not found.');
      return res.redirect(`/dashboard/${req.user.slug}/profiles`);
    }
    res.render('profiles/show', { profile, slug: req.user.slug });
  } catch (err) {
    console.error('Error loading profile:', err);
    req.flash('error_msg', 'Error loading profile. Please try again.');
    res.redirect(`/dashboard/${req.user.slug}/profiles`);
  }
};

