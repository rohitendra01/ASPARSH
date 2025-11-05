const { isLoggedIn } = require('../middleware/authMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });


const express = require('express');
const router = express.Router({ mergeParams: true });
const portfolioController = require('../controllers/portfolioController');
const { uploadPortfolioImages } = require('../middleware/uploadMiddleware');

// List all portfolios for the dashboard (mounted at /dashboard/:slug/portfolios)
router.get('/', isLoggedIn, portfolioController.listPortfolios);

// Render form to create new portfolio
router.get('/new', isLoggedIn, portfolioController.showCreateForm);

// Create portfolio
router.post('/new', isLoggedIn, uploadPortfolioImages, csrfProtection, portfolioController.createPortfolio);

// Public view of a portfolio by slug
router.get('/:slug', portfolioController.getPortfolioBySlug);

module.exports = router;