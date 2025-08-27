const express = require('express');
const router = express.Router({ mergeParams: true });
const profileController = require('../controllers/profileController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: false });

// List profiles
router.get('/', isLoggedIn, profileController.listProfiles);

// Render new profile form
router.get('/new', isLoggedIn, profileController.renderNewProfileForm);

// Create profile
router.post('/', isLoggedIn, csrfProtection, profileController.createProfile);

// Show profile (public under dashboard)
router.get('/:profileSlug', profileController.showProfile);

// Render edit form
router.get('/:profileSlug/edit', isLoggedIn, profileController.renderEditProfileForm);

// Update profile (POST for form submissions)
router.post('/:profileSlug', isLoggedIn, csrfProtection, profileController.updateProfile);

// Delete profile
router.post('/:profileSlug/delete', isLoggedIn, csrfProtection, profileController.deleteProfile);

module.exports = router;
 