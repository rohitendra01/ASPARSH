const express = require('express');
const router = express.Router({ mergeParams: true });

const reviewController = require('../controllers/reviewController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

// ============ DASHBOARD ROUTES (Admin) ============

// Render form to create new review link
router.get('/new', isLoggedIn, reviewController.renderNewForm);

router.get('/search-profiles', reviewController.searchProfiles);

// Create new review link
router.post('/', isLoggedIn, csrfProtection, reviewController.create);

// List all review links for the profile
router.get('/', isLoggedIn, reviewController.list);

// Edit review link form
router.post('/:id/delete', isLoggedIn, csrfProtection, reviewController.delete);

// ============ PUBLIC ROUTES ============

// Show review submission page
router.get('/:slug', reviewController.show);

// API: Generate review (AJAX)
router.post('/:slug/api/generate', reviewController.generate);

// API: Submit review tracking (AJAX)
router.post('/:slug/api/submit', reviewController.submit);

module.exports = router;