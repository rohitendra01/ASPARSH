
const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });
// View a visiting card by user ID (must be after router is initialized)

// All dashboard routes are now nested under /dashboard/:slug
router.use('/:slug', (req, res, next) => {
  req.dashboardSlug = req.params.slug;
  next();
});

// Dashboard home page
router.get('/:slug', isLoggedIn, dashboardController.dashboardHome);

// User profile page (dashboard)
router.get('/:slug/user/view/:userSlug', isLoggedIn, dashboardController.dashboardUserProfile);

// Hotels index
router.get('/:slug/hotels/index', isLoggedIn, dashboardController.dashboardHotelsIndex);

// Visiting card creation form (admin)
router.get('/:slug/visiting-card/new', isLoggedIn, dashboardController.renderNewVisitingCardForm);
router.post('/:slug/visiting-card/new', isLoggedIn, dashboardController.createVisitingCard);

// New business visiting card route (with typo as requested)
router.get('/visiting-card/:cardId', dashboardController.showVisitingCard);
router.get('/:slug/portfolios/business/new', isLoggedIn, (req, res) => {
    res.render('portfolios/business/new', { layout: 'layouts/dashboard-boilerplate', currentUser: req.user });
});
router.post('/:slug/portfolios/business/visiting-card/new', isLoggedIn, upload.single('image'), dashboardController.createBusinessVisitingCard);

// Dashboard business portfolio index
router.get('/:slug/portfolios', isLoggedIn, dashboardController.dashboardPortfolioIndex);

// Edit user profile
router.get('/:slug/user/edit/:userSlug', isLoggedIn, dashboardController.getEditUserProfile);
router.post('/:slug/user/edit/:userSlug', isLoggedIn, upload.single('image'), dashboardController.updateUserProfile);

module.exports = router;
