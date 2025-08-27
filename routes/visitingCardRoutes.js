const express = require('express');
const router = express.Router({ mergeParams: true });
const visitingCardController = require('../controllers/visitingCardController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: false });

// List visiting cards (dashboard)
router.get('/', isLoggedIn, visitingCardController.list);

// Render new form
router.get('/new', isLoggedIn, visitingCardController.renderNewForm);

// Create visiting card
router.post('/', isLoggedIn, csrfProtection, visitingCardController.create);

// Edit form
router.get('/:id/edit', isLoggedIn, visitingCardController.renderEditForm);

// Update (PUT and POST for forms)
router.put('/:id', isLoggedIn, csrfProtection, visitingCardController.update);
router.post('/:id', isLoggedIn, csrfProtection, visitingCardController.update);

// Delete (DELETE and POST)
router.delete('/:id', isLoggedIn, csrfProtection, visitingCardController.delete);
router.post('/:id/delete', isLoggedIn, csrfProtection, visitingCardController.delete);

module.exports = router;
