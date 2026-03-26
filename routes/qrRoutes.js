const express = require('express');
const router = express.Router({ mergeParams: true });
const { isLoggedIn } = require('../middleware/authMiddleware');
const qrController = require('../controllers/qrController');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

// List all QR codes
router.get('/', isLoggedIn, qrController.index);

// Bulk generate QRs
router.post('/bulk-generate', isLoggedIn, csrfProtection, qrController.bulkGenerate);

// Get single QR (JSON for side panel)
router.get('/:id', isLoggedIn, qrController.getOne);

// Update a QR
router.post('/:id/update', isLoggedIn, csrfProtection, qrController.updateOne);

// Delete a QR
router.post('/:id/delete', isLoggedIn, csrfProtection, qrController.deleteOne);

module.exports = router;
