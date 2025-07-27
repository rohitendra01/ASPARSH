const express = require('express');
const router = express.Router();
const loginOtpController = require('../controllers/loginOtpController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply storeReturnTo middleware globally
router.use(authMiddleware.storeReturnTo);

router.get('/login', loginOtpController.getLoginPage);
router.post('/login', loginOtpController.loginUser);
router.get('/logout', authMiddleware.isLoggedIn, loginOtpController.logoutUser);
router.post('/request-otp', loginOtpController.requestOtp);
router.post('/resend-otp', loginOtpController.resendOtp);
router.post('/verify-otp', loginOtpController.verifyOtp);
router.post('/reset-password-otp', loginOtpController.resetPasswordOtp);

module.exports = router;