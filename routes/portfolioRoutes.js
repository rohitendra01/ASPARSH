const express = require('express');
const router = express.Router({ mergeParams: true });
const portfolioController = require('../controllers/portfolioController');
const profileController = require('../controllers/profileController');
const { isLoggedIn } = require('../middleware/authMiddleware');

// List all portfolios for a user
router.get('/', portfolioController.listPortfolios);

// Render new portfolio form
router.get('/new', isLoggedIn, profileController.renderNewProfileForm);

// Create a new profile
router.post('/new', isLoggedIn, profileController.createProfile);

// Show a single portfolio (optional)
router.get('/:id', portfolioController.showPortfolio);

// Render edit form for a portfolio
router.get('/:id/edit', portfolioController.renderEditForm);

// Update a portfolio
router.put('/:id', portfolioController.updatePortfolio);

// Delete a portfolio
router.delete('/:id', portfolioController.deletePortfolio);

module.exports = router;