const express = require('express');
const router = express.Router({ mergeParams: true });
const profileController = require('../controllers/profileController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });
const { upload } = require('../middleware/uploadMiddleware');

router.get('/', isLoggedIn, profileController.listProfiles);

router.get('/new', isLoggedIn, profileController.renderNewProfileForm);

router.post('/', isLoggedIn, upload.single('image'), csrfProtection, profileController.createProfile);

router.get('/:profileSlug', profileController.showProfile);

router.get('/:profileSlug/edit', isLoggedIn, profileController.renderEditProfileForm);

router.post('/:profileSlug', isLoggedIn, csrfProtection, profileController.updateProfile);

router.post('/:profileSlug/delete', isLoggedIn, csrfProtection, profileController.deleteProfile);

module.exports = router;
