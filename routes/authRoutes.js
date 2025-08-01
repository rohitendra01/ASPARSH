const express = require('express');
const router = express.Router();
const loginOtpController = require('../controllers/loginOtpController');
const authController = require('../controllers/authController');
// Registration routes
router.get('/register', authController.getRegisterPage);
router.post('/register', authController.registerUser);
const authMiddleware = require('../middleware/authMiddleware');

// Apply storeReturnTo middleware globally
router.use(authMiddleware.storeReturnTo);

router.get('/login', loginOtpController.getLoginPage);
router.post('/login', loginOtpController.loginUser);
router.post('/logout', authMiddleware.isLoggedIn, loginOtpController.logoutUser);
router.post('/request-otp', loginOtpController.requestOtp);
router.post('/resend-otp', loginOtpController.resendOtp);
router.post('/verify-otp', loginOtpController.verifyOtp);
router.post('/reset-password-otp', loginOtpController.resetPasswordOtp);

module.exports = router;