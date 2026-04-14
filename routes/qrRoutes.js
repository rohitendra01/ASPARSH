const express = require('express');
const router = express.Router({ mergeParams: true });
const { isLoggedIn } = require('../middleware/authMiddleware');
const qrController = require('../controllers/qrController');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

router.get('/', isLoggedIn, qrController.index);

router.post('/bulk-generate', isLoggedIn, csrfProtection, qrController.bulkGenerate);

router.get('/:id', isLoggedIn, qrController.getOne);

router.post('/:id/update', isLoggedIn, csrfProtection, qrController.updateOne);

router.post('/:id/delete', isLoggedIn, csrfProtection, qrController.deleteOne);

module.exports = router;
