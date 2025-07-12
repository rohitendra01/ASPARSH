const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply storeReturnTo middleware globally
router.use(authMiddleware.storeReturnTo);

router.get('/register', authMiddleware.isGuest, authController.getRegisterPage);
router.post('/register', authController.registerUser);
router.get('/login', authController.getLoginPage);
router.post('/login', authController.loginUser);
router.get('/logout', authMiddleware.isLoggedIn, authController.logoutUser);

module.exports = router;