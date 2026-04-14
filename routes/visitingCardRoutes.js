const express = require('express');
const router = express.Router({ mergeParams: true });
const visitingCardController = require('../controllers/visitingCardController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

// Multer field config for dynamic vCard image uploads
const vcardUpload = upload.any();

// ─── Dashboard list ──────────────────────────────────────────────────────────
router.get('/', isLoggedIn, visitingCardController.list);

// ─── New vCard form ──────────────────────────────────────────────────────────
router.get('/new', isLoggedIn, csrfProtection, visitingCardController.renderNewForm);

// ─── Template schema API (AJAX) ──────────────────────────────────────────────
router.get('/template/:templateId/schema', isLoggedIn, visitingCardController.getTemplateSchema);

// ─── Create vCard (multipart for image uploads) ──────────────────────────────
router.post('/', isLoggedIn, vcardUpload, handleUploadError, csrfProtection, visitingCardController.createVisitingCard);

// ─── Edit form ───────────────────────────────────────────────────────────────
router.get('/:id/edit', isLoggedIn, csrfProtection, visitingCardController.renderEditForm);

// ─── Update ──────────────────────────────────────────────────────────────────
router.put('/:id', isLoggedIn, vcardUpload, handleUploadError, csrfProtection, visitingCardController.update);
router.post('/:id', isLoggedIn, vcardUpload, handleUploadError, csrfProtection, visitingCardController.update);

// ─── Delete ──────────────────────────────────────────────────────────────────
router.delete('/:id', isLoggedIn, csrfProtection, visitingCardController.delete);
router.post('/:id/delete', isLoggedIn, csrfProtection, visitingCardController.delete);

module.exports = router;