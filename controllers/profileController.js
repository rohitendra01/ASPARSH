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
    const {
      name,
      email,
      mobile,
      addressLine,
      country,
      city,
      postcode
    } = req.body;

    let imageUrl = '';
    if (req.file) {
      // Upload image to Cloudinary
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          folder: 'asparsh/profiles',
          resource_type: 'image',
          public_id: `profile_${Date.now()}`,
          overwrite: true
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    }

    // Auto-generate slug from name
    const slug = name ? name.trim().toLowerCase().replace(/\s+/g, '-') : '';
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
      slug
    });
    await profile.save();
    req.flash('success_msg', 'Profile created successfully!');
    res.redirect(`/dashboard/${req.params.slug}/profiles`);
  } catch (err) {
    console.error('Error creating profile:', err);
    req.flash('error_msg', 'Error creating profile. Please try again.');
    res.redirect(`/dashboard/${req.params.slug}/profiles`);
  }
};

// List all profiles for the current user
exports.listProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({ createdBy: req.user._id });
    const slug = req.user.slug;
    res.render('profiles/index', { profiles, userSlug: slug, slug });
  } catch (err) {
    console.error('Error loading profiles:', err);
    const slug = req.user.slug;
    res.render('profiles/index', { profiles: [], userSlug: slug, slug });
  }
};
