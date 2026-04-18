const SESSION_MAX_AGE_MS = 1000 * 60 * 30;
const NEWSLETTER_STATUS_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_MIN_LENGTH = 12;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LIFETIME_MS = 10 * 60 * 1000;

function isProduction() {
    return process.env.NODE_ENV === 'production';
}

function getRequiredEnv(name) {
    const value = (process.env[name] || '').trim();
    if (value) return value;

    if (process.env.NODE_ENV === 'test') {
        return `test-${name.toLowerCase()}`;
    }

    throw new Error(`Missing required environment variable: ${name}`);
}

function getTrustProxySetting() {
    const raw = (process.env.TRUST_PROXY || '').trim();
    if (!raw) {
        return isProduction() ? 1 : false;
    }

    if (raw === 'true') return 1;
    if (raw === 'false') return false;

    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0) {
        return parsed;
    }

    return false;
}

function getSessionCookieName() {
    if (process.env.SESSION_COOKIE_NAME) {
        return process.env.SESSION_COOKIE_NAME.trim();
    }

    return isProduction() ? '__Host-session' : 'asparsh.sid';
}

function getNewsletterCookieName() {
    return 'asparsh.newsletter';
}

function buildSessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction(),
        path: '/',
        priority: 'high',
        maxAge: SESSION_MAX_AGE_MS
    };
}

function buildNewsletterCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction(),
        path: '/',
        maxAge: NEWSLETTER_STATUS_MAX_AGE_MS
    };
}

function getCspDirectives() {
    const directives = {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'", 'https://api.iconify.design'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
        styleSrcAttr: ["'unsafe-inline'"]
    };

    if (isProduction()) {
        directives.upgradeInsecureRequests = [];
    }

    return directives;
}

function validateEssentialEnv() {
    getRequiredEnv('MONGO_URI');
    getRequiredEnv('JWT_SECRET');
    getRequiredEnv('SESSION_SECRET');
}

module.exports = {
    NEWSLETTER_STATUS_MAX_AGE_MS,
    OTP_LIFETIME_MS,
    OTP_MAX_ATTEMPTS,
    PASSWORD_MIN_LENGTH,
    SESSION_MAX_AGE_MS,
    buildNewsletterCookieOptions,
    buildSessionCookieOptions,
    getCspDirectives,
    getNewsletterCookieName,
    getRequiredEnv,
    getSessionCookieName,
    getTrustProxySetting,
    isProduction,
    validateEssentialEnv
};
