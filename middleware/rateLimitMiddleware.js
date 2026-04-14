const rateLimit = require('express-rate-limit');

exports.newsletterLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: {
        success: false,
        message: 'Too many attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});