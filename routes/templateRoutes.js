const express = require('express');
const router = express.Router({ mergeParams: true });
const templateController = require('../controllers/templateController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');
const csurf = require('csurf');

const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

router.get('/new', isLoggedIn, csrfProtection, templateController.renderNewForm);

router.post(
    '/',
    isLoggedIn,
    upload.single('thumbnail'),
    handleUploadError,
    csrfProtection,
    templateController.create
);

router.get('/:id/edit', isLoggedIn, csrfProtection, templateController.renderEditForm);

router.post(
    '/:id',
    isLoggedIn,
    upload.single('thumbnail'),
    handleUploadError,
    csrfProtection,
    templateController.update
);

// ─── Delete template ─────────────────────────────────────────────────────────
router.delete('/:id', isLoggedIn, csrfProtection, templateController.delete);
router.post('/:id/delete', isLoggedIn, csrfProtection, templateController.delete);

module.exports = router;