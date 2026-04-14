const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const { upload } = require('../middleware/uploadMiddleware'); // <-- IMPORT CENTRALIZED UPLOAD
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

router.get('/edit/:slug', isLoggedIn, userController.renderEditUserProfile);

router.post('/edit/:slug', isLoggedIn, upload.single('image'), csrfProtection, userController.updateUserProfile);

router.get('/:slug', isLoggedIn, userController.viewUserProfile);

module.exports = router;