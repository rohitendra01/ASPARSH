const Profile = require('../models/Profile');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Render new profile form
exports.renderNewProfileForm = (req, res) => {
  res.render('profiles/new', { userSlug: req.params.slug });
};

// Handle profile creation
exports.createProfile = async (req, res) => {
  const data = req.body;
  try {
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
    const slug = data.name ? data.name.trim().toLowerCase().replace(/\s+/g, '-') : '';

    // Build address object from form fields
    const address = {
      addressLine: data.addressLine || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      postcode: data.postcode || ''
    };

    const newProfile = new Profile({
      ...data,
      createdBy: req.user._id,
      image: imageUrl || '', // Explicitly set the image URL
      address,
      socialLinks: data.socialLinks || [],
      slug: slug
    });

    await newProfile.save();
    req.flash('success_msg', 'Profile created successfully!');
    // Redirect to the newly created profile
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
    let query = {};
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    const profiles = await Profile.find(query);
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

