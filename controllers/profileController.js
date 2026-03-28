const Profile = require('../models/Profile');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Render new profile form
exports.renderNewProfileForm = (req, res) => {
  res.render('profiles/new', { userSlug: req.params.slug });
};


// List all profiles for the current user
exports.listProfiles = async (req, res) => {
  try {
    let query = {};
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    const profiles = await Profile.find(query).populate({ path: 'createdBy', select: 'username' });
    const slug = req.user.slug;
    res.render('profiles/index', { profiles, userSlug: slug, slug });
  } catch (err) {
    console.error('Error loading profiles:', err);
    const slug = req.user.slug;
    res.render('profiles/index', { profiles: [], userSlug: slug, slug });
  }
};

// Render profile details (Updated to fetch real stats from all modules)
exports.showProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ slug: req.params.profileSlug });
    if (!profile) {
      req.flash('error_msg', 'Profile not found.');
      return res.redirect(`/dashboard/${req.user.slug}/profiles`);
    }

    // Dynamically require models to prevent circular dependencies
    const Hotel = require('../models/Hotel');
    const { Portfolio } = require('../models/Portfolio'); // Destructured based on your controller
    const VisitingCard = require('../models/VisitingCard');
    const ReviewLink = require('../models/ReviewLink');

    // Fetch real statistics in parallel for maximum performance
    const [hotels, portfolios, visitingCards, reviewLinks] = await Promise.all([
      Hotel.find({ createdByProfile: profile._id }).lean(),
      Portfolio.find({ profileId: profile._id }).populate('design', 'name').lean(),
      VisitingCard.find({ profileSlug: profile.slug }).lean(),
      ReviewLink.find({ profileId: profile._id }).lean()
    ]);

    // Pass currentUser with image for header
    let currentUser = req.user;
    if (currentUser && !currentUser.image) {
      currentUser.image = currentUser.cloudinaryImageUrl || '';
    }

    res.render('profiles/show', {
      profile,
      slug: req.user.slug,
      hotels,
      portfolios,
      visitingCards,
      reviewLinks,
      currentUser
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    req.flash('error_msg', 'Error loading profile. Please try again.');
    res.redirect(`/dashboard/${req.user.slug}/profiles`);
  }
};


// Render edit profile form
exports.renderEditProfileForm = async (req, res) => {
  try {
    const profile = await Profile.findOne({ slug: req.params.profileSlug });
    if (!profile) {
      req.flash('error_msg', 'Profile not found.');
      return res.redirect(`/dashboard/${req.params.slug}/profiles`);
    }
    // Always pass slug from req.params, fallback to req.user.slug if missing
    let slug = req.params.slug;
    if (!slug && req.user && req.user.slug) {
      slug = req.user.slug;
    }
    res.render('profiles/edit', { profile, slug });
  } catch (err) {
    console.error('Error loading profile for edit:', err);
    req.flash('error_msg', 'Error loading profile. Please try again.');
    res.redirect(`/dashboard/${req.params.slug}/profiles`);
  }
};

// Handle profile creation
exports.createProfile = async (req, res) => {
  const data = req.body;
  try {
    const address = {
      addressLine: data.addressLine || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      postcode: data.postcode || ''
    };

    // Build the base profile data
    const profileData = {
      ...data,
      createdBy: req.user._id,
      address,
      socialLinks: data.socialLinks || [],
      occupation: data.occupation || '',
      category: data.category || '',
      experience: data.experience ? Number(data.experience) : 0,
      subcategory: data.subcategory || ''
    };

    // FIXED: Correct Cloudinary streamifier upload for Creation
    if (req.file) {
      try {
        const imageUrl = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({
            folder: 'asparsh/profiles',
            resource_type: 'image',
            quality: 'auto',       // Let Cloudinary optimize the file size
            fetch_format: 'auto',  // Deliver in WebP/AVIF if supported
            public_id: `profile_${Date.now()}`
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          });
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
        profileData.image = imageUrl;
      } catch (err) {
        console.error('Image upload failed during creation:', err);
        req.flash('error_msg', 'Image upload failed. Please try again.');
        return res.redirect(`/dashboard/${req.params.slug}/profiles`);
      }
    }

    // Create the new profile
    const newProfile = new Profile(profileData);
    await newProfile.save();
    req.flash('success_msg', 'Profile created successfully!');
    return res.redirect(`/dashboard/${req.params.slug}/profiles`);

  } catch (err) {
    console.error('Error creating profile:', err);
    req.flash('error_msg', 'Error creating profile. Please try again.');
    res.redirect(`/dashboard/${req.params.slug}/profiles`);
  }
};

// Handle profile update
exports.updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ slug: req.params.profileSlug });
    if (!profile) {
      req.flash('error_msg', 'Profile not found.');
      return res.redirect(`/dashboard/${req.params.slug}/profiles`);
    }

    // Update fields
    profile.name = req.body.name;
    profile.email = req.body.email;
    profile.mobile = req.body.mobile;
    profile.address = {
      addressLine: req.body.addressLine || '',
      city: req.body.city || '',
      state: req.body.state || '',
      country: req.body.country || '',
      postcode: req.body.postcode || ''
    };
    profile.socialLinks = req.body.socialLinks || [];
    profile.occupation = req.body.occupation || '';
    profile.category = req.body.category || '';
    profile.experience = req.body.experience ? Number(req.body.experience) : 0;
    profile.subcategory = req.body.subcategory || '';

    // Handle image deletion / replacement
    if ((req.body.deleteImage || req.file) && profile.image) {
      try {
        const publicIdMatch = profile.image.match(/\/([^\/]+)$/);
        if (publicIdMatch) {
          const publicId = publicIdMatch[1].split('.')[0];
          await cloudinary.uploader.destroy('asparsh/profiles/' + publicId);
        }
      } catch (err) {
        console.error('Cloudinary image delete error:', err);
      }
      if (req.body.deleteImage) profile.image = '';
    }

    // Handle new image upload
    if (req.file) {
      try {
        const imageUrl = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({
            folder: 'asparsh/profiles',
            resource_type: 'image',
            quality: 'auto',       // Added optimization
            fetch_format: 'auto',  // Added optimization
            public_id: `profile_${Date.now()}`,
            overwrite: true
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          });
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
        profile.image = imageUrl;
      } catch (err) {
        console.error('Image upload failed:', err);
        req.flash('error_msg', 'Image upload failed. Please try again.');
      }
    }

    await profile.save();
    req.flash('success_msg', 'Profile updated successfully!');
    res.redirect(`/dashboard/${req.params.slug}/profiles`);
  } catch (err) {
    console.error('Error updating profile:', err);
    req.flash('error_msg', 'Error updating profile. Please try again.');
    res.redirect(`/dashboard/${req.params.slug}/profiles`);
  }
};

// Handle profile deletion
exports.deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ slug: req.params.profileSlug });
    if (!profile) {
      req.flash('error_msg', 'Profile not found.');
      return res.redirect(`/dashboard/${req.params.slug}/profiles`);
    }
    // Delete image from Cloudinary if exists
    if (profile.image) {
      try {
        const publicIdMatch = profile.image.match(/\/([^\/]+)$/);
        if (publicIdMatch) {
          const publicId = publicIdMatch[1].split('.')[0];
          await cloudinary.uploader.destroy('asparsh/profiles/' + publicId);
        }
      } catch (err) {
        console.error('Cloudinary image delete error:', err);
      }
    }
    await Profile.deleteOne({ slug: req.params.profileSlug });
    req.flash('success_msg', 'Profile deleted successfully!');
    res.redirect(`/dashboard/${req.params.slug}/profiles`);
  } catch (err) {
    console.error('Error deleting profile:', err);
    req.flash('error_msg', 'Error deleting profile. Please try again.');
    res.redirect(`/dashboard/${req.params.slug}/profiles`);
  }
};