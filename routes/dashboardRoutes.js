const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const portfolioController = require('../controllers/portfolioController');
const reviewRoutes = require('../routes/reviewRoutes');



// Route: dashboard home (protected)
router.get('/', isLoggedIn, (req, res) => {
  res.render('dashboard', { layout: 'layouts-boilerplate' });
});

// Route for /:slug/user to view profile
router.get('/user', isLoggedIn, userController.viewUserProfile);

// Route for /:slug/profiles to view all profiles
router.get('/profiles', isLoggedIn, profileController.listProfiles);

// Route for /:slug/profiles/new (render form)
router.get('/profiles/new', isLoggedIn, profileController.renderNewProfileForm);

// Route for /:slug/profiles/new (handle POST)
router.post('/profiles/new', isLoggedIn, upload.single('image'), csrfProtection, profileController.createProfile);

// Route for /:slug/profiles/:profileSlug (show profile details)
router.get('/profiles/:profileSlug', isLoggedIn, profileController.showProfile);

// Route for /:slug/profiles/:profileSlug/edit (render form)
router.get('/profiles/:profileSlug/edit', isLoggedIn, profileController.renderEditProfileForm);

// Route for /:slug/profiles/:profileSlug/edit (handle POST)
router.post('/profiles/:profileSlug/edit', isLoggedIn, upload.single('image'), csrfProtection, profileController.updateProfile);

// Route for /:slug/profiles/:profileSlug/delete (handle POST)
router.post('/profiles/:profileSlug/delete', isLoggedIn, csrfProtection, profileController.deleteProfile);

router.use('/profiles/:profileSlug/reviews', reviewRoutes);


module.exports = router;