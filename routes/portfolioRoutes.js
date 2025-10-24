const { isLoggedIn } = require('../middleware/authMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });


const express = require('express');
// mergeParams true so the parent route's :slug param is available to controllers
const router = express.Router({ mergeParams: true });
const portfolioController = require('../controllers/portfolioController');
const { uploadPortfolioImages } = require('../middleware/uploadMiddleware');

// List all portfolios for the dashboard (mounted at /dashboard/:slug/portfolios)
router.get('/', isLoggedIn, portfolioController.listPortfolios);

// Render form to create new portfolio
router.get('/new', isLoggedIn, portfolioController.showCreateForm);

// Create portfolio (image upload handled by middleware)
router.post('/new', isLoggedIn, uploadPortfolioImages, csrfProtection, portfolioController.createPortfolio);

// Public view of a portfolio by slug (no auth required)
router.get('/:slug', portfolioController.getPortfolioBySlug);

module.exports = router;