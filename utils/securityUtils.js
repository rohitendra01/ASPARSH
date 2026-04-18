const validator = require('validator');
const { PASSWORD_MIN_LENGTH } = require('./securityConfig');

exports.getCsrfToken = (req, res) => {
    let token;
    let generationError = null;
    if (typeof req.csrfToken === 'function') {
        try {
            token = req.csrfToken();
        } catch (e) {
            generationError = e;
            const reqId = req.id || (req.headers && (req.headers['x-request-id'] || req.headers['x-request_id'])) || null;
            const userId = req.user && (req.user._id || req.user.id) ? String(req.user._id || req.user.id) : null;
            console.error('CSRF token generation failed', { message: e.message, reqId, userId });
        }
    }
    if (!token && res && res.locals && res.locals.csrfToken) token = res.locals.csrfToken;
    return { token, generationError };
};

exports.isValidSlug = (s) => {
    if (!s || typeof s !== 'string') return false;
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(s.trim());
};

exports.getPasswordPolicyMessage = () => {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long and include uppercase, lowercase, number, and special character.`;
};

exports.isStrongPassword = (password) => {
    if (typeof password !== 'string') return false;

    return validator.isStrongPassword(password, {
        minLength: PASSWORD_MIN_LENGTH,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    });
};

exports.validatePasswordStrength = (password) => {
    if (!password) {
        return 'Password is required';
    }

    if (!exports.isStrongPassword(password)) {
        return exports.getPasswordPolicyMessage();
    }

    return null;
};

exports.sanitizeReturnTo = (candidate, fallback = '/') => {
    if (typeof candidate !== 'string') return fallback;

    const trimmed = candidate.trim();
    if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
        return fallback;
    }

    try {
        const parsed = new URL(trimmed, 'http://localhost');
        const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;

        if (normalized.startsWith('/login') || normalized.startsWith('/logout')) {
            return fallback;
        }

        return normalized;
    } catch (error) {
        return fallback;
    }
};

exports.storeSafeReturnTo = (req, candidate) => {
    const safeReturnTo = exports.sanitizeReturnTo(candidate, '');
    if (!safeReturnTo || !req || !req.session) return null;

    req.session.returnTo = safeReturnTo;
    return safeReturnTo;
};

exports.consumeSafeReturnTo = (req, fallback = '/') => {
    const safeReturnTo = exports.sanitizeReturnTo(req && req.session ? req.session.returnTo : null, fallback);

    if (req && req.session) {
        delete req.session.returnTo;
    }

    return safeReturnTo;
};
