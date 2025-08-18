const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
// dashboardController removed
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const portfolioController = require('../controllers/portfolioController');

// Route for /:slug/portfolios to view all portfolios
router.get('/:slug/portfolios', isLoggedIn, portfolioController.listPortfolios);

// Route for /:slug/portfolios/new (render form)
router.get('/:slug/portfolios/new', isLoggedIn, portfolioController.renderNewForm);

// Route for /:slug/portfolios/new (handle POST)
router.post('/:slug/portfolios/new', isLoggedIn, upload.single('portfolioImage'), portfolioController.createPortfolio);

// Route for /:slug/portfolios/:id (show portfolio details)
router.get('/:slug/portfolios/:id', isLoggedIn, portfolioController.showPortfolio);

// Route for /:slug/portfolios/:id/edit (render form)
router.get('/:slug/portfolios/:id/edit', isLoggedIn, portfolioController.renderEditForm);

// Route for /:slug/portfolios/:id/edit (handle POST)
router.post('/:slug/portfolios/:id/edit', isLoggedIn, upload.single('portfolioImage'), portfolioController.updatePortfolio);

// Route for /:slug/portfolios/:id/delete (handle POST)
router.post('/:slug/portfolios/:id/delete', isLoggedIn, portfolioController.deletePortfolio);

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
router.post('/profiles/new', isLoggedIn, upload.single('image'), profileController.createProfile);

// Route for /:slug/profiles/:profileSlug (show profile details)
router.get('/profiles/:profileSlug', isLoggedIn, profileController.showProfile);

// Route for /:slug/profiles/:profileSlug/edit (render form)
router.get('/profiles/:profileSlug/edit', isLoggedIn, profileController.renderEditProfileForm);

// Route for /:slug/profiles/:profileSlug/edit (handle POST)
router.post('/profiles/:profileSlug/edit', isLoggedIn, upload.single('image'), profileController.updateProfile);

// Route for /:slug/profiles/:profileSlug/delete (handle POST)
router.post('/profiles/:profileSlug/delete', isLoggedIn, profileController.deleteProfile);

module.exports = router;