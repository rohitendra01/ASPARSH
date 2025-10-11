const express = require('express');
const router = express.Router();
const apicache = require('apicache');
const cache = apicache.middleware;
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });
const loginOtpController = require('../controllers/loginOtpController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Registration routes - do NOT cache CSRF-protected pages
router.get('/register', csrfProtection, authController.getRegisterPage);
router.post('/register', csrfProtection, authController.registerUser);

// Apply storeReturnTo middleware globally

router.use(authMiddleware.storeReturnTo);

router.get('/login', csrfProtection, loginOtpController.getLoginPage);
router.post('/login', csrfProtection, loginOtpController.loginUser);
router.post('/logout', authMiddleware.isLoggedIn, csrfProtection, loginOtpController.logoutUser);
router.post('/request-otp', csrfProtection, loginOtpController.requestOtp);
router.post('/resend-otp', csrfProtection, loginOtpController.resendOtp);
router.post('/verify-otp', csrfProtection, loginOtpController.verifyOtp);
router.post('/reset-password-otp', csrfProtection, loginOtpController.resetPasswordOtp);

module.exports = router;