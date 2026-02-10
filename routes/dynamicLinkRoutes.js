const express = require('express');
const router = express.Router({ mergeParams: true });
const { isLoggedIn } = require('../middleware/authMiddleware');
const dynamicLinkController = require('../controllers/dynamicLinkController');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

// Debug Logging
router.use((req, res, next) => {
    next();
});


// List all links
router.get('/', isLoggedIn, dynamicLinkController.index);

// Show new link form
router.get('/new', isLoggedIn, dynamicLinkController.renderNewForm);

// Create link
router.post('/new', isLoggedIn, csrfProtection, dynamicLinkController.createLink);

// Show edit link form
router.get('/:id/edit', isLoggedIn, dynamicLinkController.renderEditForm);

// Update link (POST used for simplicity without method-override)
router.post('/:id/edit', isLoggedIn, csrfProtection, dynamicLinkController.updateLink);

// Delete link
router.post('/:id/delete', isLoggedIn, csrfProtection, dynamicLinkController.deleteLink);

// Get QR Code content (API style or just render) - we'll do an endpoint to fetch the QR code data URL
router.get('/:id/qr', isLoggedIn, dynamicLinkController.getQrCode);

module.exports = router;
