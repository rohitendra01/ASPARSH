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