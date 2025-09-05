const express = require('express');
const router = express.Router({ mergeParams: true });
const visitingCardController = require('../controllers/visitingCardController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: false });

// List visiting cards (dashboard)
router.get('/', isLoggedIn, visitingCardController.list);

// Render new form
router.get('/new', isLoggedIn, csrfProtection, visitingCardController.renderNewForm);

// Edit form by profile slug (open the latest card for a profile)
router.get('/profile/:profileSlug/edit', isLoggedIn, csrfProtection, visitingCardController.renderEditForm);

// Edit form by visiting-card id (existing)
router.get('/:id/edit', isLoggedIn, csrfProtection, visitingCardController.renderEditForm);

// Create visiting card
router.post('/', isLoggedIn, csrfProtection, visitingCardController.create);

// (moved above)

// Update (PUT and POST for forms)
router.put('/:id', isLoggedIn, csrfProtection, visitingCardController.update);
router.post('/:id', isLoggedIn, csrfProtection, visitingCardController.update);

// Delete (DELETE and POST)
router.delete('/:id', isLoggedIn, csrfProtection, visitingCardController.delete);
router.post('/:id/delete', isLoggedIn, csrfProtection, visitingCardController.delete);

module.exports = router;
