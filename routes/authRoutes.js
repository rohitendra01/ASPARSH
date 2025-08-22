const express = require('express');
const router = express.Router();
const apicache = require('apicache');
const cache = apicache.middleware;
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: false });
const loginOtpController = require('../controllers/loginOtpController');
const authController = require('../controllers/authController');
// Registration routes - do NOT cache CSRF-protected pages
router.get('/register', csrfProtection, authController.getRegisterPage);
router.post('/register', csrfProtection, authController.registerUser);
const authMiddleware = require('../middleware/authMiddleware');

// Apply storeReturnTo middleware globally
router.use(authMiddleware.storeReturnTo);

router.get('/login', csrfProtection, loginOtpController.getLoginPage);
router.post('/login', csrfProtection, loginOtpController.loginUser);
router.post('/logout', authMiddleware.isLoggedIn, csrfProtection, loginOtpController.logoutUser);
router.post('/request-otp', loginOtpController.requestOtp);
router.post('/resend-otp', loginOtpController.resendOtp);
router.post('/verify-otp', loginOtpController.verifyOtp);
router.post('/reset-password-otp', loginOtpController.resetPasswordOtp);

module.exports = router;