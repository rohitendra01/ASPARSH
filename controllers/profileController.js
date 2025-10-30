const Profile = require('../models/Profile');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Render new profile form
exports.renderNewProfileForm = (req, res) => {
  res.render('profiles/new', { userSlug: req.params.slug });
};

// Handle profile creation
// In your profileController.js

exports.createProfile = async (req, res) => {
  const data = req.body;
  try {
    // Build address object from form fields
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

    // ** THIS IS THE KEY CHANGE **
    // The middleware already uploaded the file. 
    // We just get the URL from req.file.path (this is set by multer-storage-cloudinary)
    if (req.file) {
      profileData.image = req.file.path;
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

// Render profile details
exports.showProfile = async (req, res) => {
  try {
    // Find profile by slug (public for dashboard)
    const profile = await Profile.findOne({ slug: req.params.profileSlug });
    if (!profile) {
      req.flash('error_msg', 'Profile not found.');
      return res.redirect(`/dashboard/${req.user.slug}/profiles`);
    }
    // Fetch hotels created by this profile
    const Hotel = require('../models/Hotel');
    const hotels = await Hotel.find({ createdByProfile: profile._id });
    // Pass currentUser with image for header
    let currentUser = req.user;
    if (currentUser && !currentUser.image) {
      // Fallback to cloudinaryImageUrl if available
      currentUser.image = currentUser.cloudinaryImageUrl || '';
    }
    res.render('profiles/show', { profile, slug: req.user.slug, hotels, currentUser });
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

    // Handle image deletion
    if (req.body.deleteImage && profile.image) {
      try {
        // Extract public_id from URL
        const publicIdMatch = profile.image.match(/\/([^\/]+)$/);
        if (publicIdMatch) {
          await cloudinary.uploader.destroy('asparsh/profiles/' + publicIdMatch[1]);
        }
      } catch (err) {
        console.error('Cloudinary image delete error:', err);
      }
      profile.image = '';
    }
    
    // Handle new image upload
    if (req.file) {
      try {
        const imageUrl = await new Promise((resolve, reject) => {
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
          await cloudinary.uploader.destroy('asparsh/profiles/' + publicIdMatch[1]);
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