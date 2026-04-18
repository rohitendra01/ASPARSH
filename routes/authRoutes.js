const express = require('express');
const router = express.Router();
const loginOtpController = require('../controllers/loginOtpController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimit');
const { getPasswordPolicyMessage, sanitizeReturnTo } = require('../utils/securityUtils');

function getCsrf(req, res) {
    if (typeof req.csrfToken === 'function') return req.csrfToken();
    if (res && res.locals && res.locals.csrfToken) return res.locals.csrfToken;
    return null;
}

function buildAuthRateLimiter(options) {
    return createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: options.max,
        skipSuccessfulRequests: Boolean(options.skipSuccessfulRequests),
        handler: (req, res) => {
            const message = options.message;
            const accepts = (req.headers.accept || '').toLowerCase();
            const isJsonRequest = req.xhr || accepts.includes('application/json') || req.is('json');

            if (isJsonRequest) {
                return res.status(429).json({ success: false, message });
            }

            const locals = options.getLocals ? options.getLocals(req, res) : {};
            return res.status(429).render(options.view || 'users/login', {
                error_msg: message,
                csrfToken: getCsrf(req, res),
                ...locals
            });
        }
    });
}

const loginLimiter = buildAuthRateLimiter({
    max: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    skipSuccessfulRequests: true,
    view: 'users/login',
    getLocals: (req) => ({
        email: req.body && req.body.email ? req.body.email : '',
        returnTo: sanitizeReturnTo(req.body && req.body.returnTo ? req.body.returnTo : (req.session && req.session.returnTo), '/'),
        passwordPolicy: getPasswordPolicyMessage()
    })
});
const otpRequestLimiter = buildAuthRateLimiter({
    max: 3,
    message: 'Too many OTP requests. Please try again in 15 minutes.',
    view: 'users/login',
    getLocals: (req) => ({
        resetEmail: req.body && req.body.email ? req.body.email : '',
        passwordPolicy: getPasswordPolicyMessage()
    })
});
const otpResendLimiter = buildAuthRateLimiter({
    max: 2,
    message: 'Too many OTP resend requests. Please try again in 15 minutes.',
    view: 'users/otp',
    getLocals: (req) => ({
        email: req.body && req.body.email ? req.body.email : ''
    })
});
const otpVerifyLimiter = buildAuthRateLimiter({
    max: 5,
    message: 'Too many OTP verification attempts. Please try again in 15 minutes.',
    skipSuccessfulRequests: true,
    view: 'users/otp',
    getLocals: (req) => ({
        email: req.body && req.body.email ? req.body.email : ''
    })
});
const resetPasswordLimiter = buildAuthRateLimiter({
    max: 3,
    message: 'Too many password reset attempts. Please try again in 15 minutes.',
    view: 'users/new-password',
    getLocals: (req) => ({
        email: req.body && req.body.email ? req.body.email : '',
        passwordPolicy: getPasswordPolicyMessage()
    })
});

router.get('/register', authController.getRegisterPage);
router.post('/register', authController.registerUser);


router.use(authMiddleware.storeReturnTo);

router.get('/login', loginOtpController.getLoginPage);
router.post('/login', loginLimiter, loginOtpController.loginUser);
router.post('/logout', authMiddleware.isLoggedIn, loginOtpController.logoutUser);
router.post('/request-otp', otpRequestLimiter, loginOtpController.requestOtp);
router.post('/resend-otp', otpResendLimiter, loginOtpController.resendOtp);
router.post('/verify-otp', otpVerifyLimiter, loginOtpController.verifyOtp);
router.post('/reset-password-otp', resetPasswordLimiter, loginOtpController.resetPasswordOtp);

module.exports = router;
