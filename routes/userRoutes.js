const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });



// More specific routes must come before the catch-all '/:slug' route
router.get('/edit/:slug', isLoggedIn, userController.renderEditUserProfile);
router.post('/edit/:slug', isLoggedIn, upload.single('image'), csrfProtection, userController.updateUserProfile);
router.get('/:slug', isLoggedIn, userController.viewUserProfile);
module.exports = router;