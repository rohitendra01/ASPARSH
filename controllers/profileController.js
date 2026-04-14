const profileService = require('../services/profileService');

exports.renderNewProfileForm = (req, res) => {
  res.render('profiles/new', { userSlug: req.params.slug });
};

exports.listProfiles = async (req, res) => {
  try {
    const profiles = await profileService.getProfileList(req.query.search);
    const slug = req.user?.slug;
    res.render('profiles/index', { profiles, userSlug: slug, slug });
  } catch (err) {
    console.error('Error loading profiles:', err);
    const slug = req.user?.slug;
    res.render('profiles/index', { profiles: [], userSlug: slug, slug });
  }
};

exports.showProfile = async (req, res) => {
  try {
    const { profile, hotels, portfolios, visitingCards, reviewLinks } = await profileService.getProfileEcosystem(req.params.profileSlug);

    let currentUser = req.user;
    if (currentUser && !currentUser.image) currentUser.image = currentUser.cloudinaryImageUrl || '';

    res.render('profiles/show', {
      profile, hotels, portfolios, visitingCards, reviewLinks, currentUser,
      slug: req.user?.slug
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    req.flash('error_msg', err.message || 'Error loading profile. Please try again.');

    const redirectSlug = req.params.slug || req.user?.slug || '';
    res.redirect(`/dashboard/${redirectSlug}/profiles`);
  }
};

exports.renderEditProfileForm = async (req, res) => {
  try {
    const { profile } = await profileService.getProfileEcosystem(req.params.profileSlug);
    let slug = req.params.slug || req.user?.slug;

    res.render('profiles/edit', { profile, slug });
  } catch (err) {
    console.error('Error loading profile for edit:', err);
    req.flash('error_msg', 'Profile not found or error loading.');

    const redirectSlug = req.params.slug || req.user?.slug || '';
    res.redirect(`/dashboard/${redirectSlug}/profiles`);
  }
};

exports.createProfile = async (req, res) => {
  try {
    await profileService.processProfileCreation(req.body, req.file, req.user._id);
    req.flash('success_msg', 'Profile created successfully!');

    const redirectSlug = req.params.slug || req.user?.slug || '';
    res.redirect(`/dashboard/${redirectSlug}/profiles`);
  } catch (err) {
    console.error('Error creating profile:', err);
    req.flash('error_msg', 'Error creating profile. Please try again.');

    const redirectSlug = req.params.slug || req.user?.slug || '';
    res.redirect(`/dashboard/${redirectSlug}/profiles`);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    await profileService.processProfileUpdate(req.params.profileSlug, req.body, req.file, req.body.deleteImage);
    req.flash('success_msg', 'Profile updated successfully!');

    const redirectSlug = req.params.slug || req.user?.slug || '';
    res.redirect(`/dashboard/${redirectSlug}/profiles`);
  } catch (err) {
    console.error('Error updating profile:', err);
    req.flash('error_msg', err.message || 'Error updating profile. Please try again.');

    const redirectSlug = req.params.slug || req.user?.slug || '';
    res.redirect(`/dashboard/${redirectSlug}/profiles`);
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    await profileService.processProfileDeletion(req.params.profileSlug);
    req.flash('success_msg', 'Profile deleted successfully!');

    const redirectSlug = req.params.slug || req.user?.slug || '';
    res.redirect(`/dashboard/${redirectSlug}/profiles`);
  } catch (err) {
    console.error('Error deleting profile:', err);
    req.flash('error_msg', err.message || 'Error deleting profile. Please try again.');

    const redirectSlug = req.params.slug || req.user?.slug || '';
    res.redirect(`/dashboard/${redirectSlug}/profiles`);
  }
};