const express = require('express');
const router = express.Router({ mergeParams: true });
const portfolioController = require('../controllers/portfolioController');
const profileController = require('../controllers/profileController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: false });

// List all portfolios for a user
router.get('/', portfolioController.listPortfolios);

// Render new portfolio form
router.get('/new', isLoggedIn, portfolioController.renderNewForm);

// Create a new portfolio (use portfolioController)
router.post('/new', isLoggedIn, csrfProtection, portfolioController.createPortfolio);

//Edit a profile
router.get('/edit', isLoggedIn, profileController.renderEditProfileForm);

// Show a single portfolio (optional)
router.get('/:id', portfolioController.showPortfolio);

// Render edit form for a portfolio
router.get('/:id/edit', portfolioController.renderEditForm);

// Update a portfolio
router.put('/:id', portfolioController.updatePortfolio);

// Delete a portfolio
router.delete('/:id', portfolioController.deletePortfolio);

// Publish a portfolio (set isPublished = true)
router.post('/:id/publish', isLoggedIn, csrfProtection, portfolioController.publishPortfolio);

// NOTE: profile search API is handled centrally at /api/profiles/search (see routes/apiRoutes.js)

module.exports = router;