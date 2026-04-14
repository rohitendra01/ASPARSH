const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const dashboardController = require('../controllers/dashboardController');
const reviewRoutes = require('../routes/reviewRoutes');

router.get('/', isLoggedIn, dashboardController.getDashboardStats);

router.get('/user', isLoggedIn, userController.viewUserProfile);

router.get('/profiles', isLoggedIn, profileController.listProfiles);
router.get('/profiles/new', isLoggedIn, profileController.renderNewProfileForm);
router.post('/profiles/new', isLoggedIn, upload.single('image'), csrfProtection, profileController.createProfile);
router.get('/profiles/:profileSlug', isLoggedIn, profileController.showProfile);
router.get('/profiles/:profileSlug/edit', isLoggedIn, profileController.renderEditProfileForm);
router.post('/profiles/:profileSlug/edit', isLoggedIn, upload.single('image'), csrfProtection, profileController.updateProfile);
router.post('/profiles/:profileSlug/delete', isLoggedIn, csrfProtection, profileController.deleteProfile);

router.use('/profiles/:profileSlug/reviews', reviewRoutes);

module.exports = router;