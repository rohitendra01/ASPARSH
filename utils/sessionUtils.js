const {
    buildSessionCookieOptions,
    getSessionCookieName
} = require('./securityConfig');
const { sanitizeReturnTo } = require('./securityUtils');

function regenerateSession(req) {
    const preservedReturnTo = sanitizeReturnTo(req && req.session ? req.session.returnTo : null, '/');

    return new Promise((resolve, reject) => {
        if (!req.session || typeof req.session.regenerate !== 'function') {
            if (!req.session) req.session = {};
            req.session.returnTo = preservedReturnTo;
            return resolve();
        }

        req.session.regenerate((err) => {
            if (err) return reject(err);
            req.session.returnTo = preservedReturnTo;
            resolve();
        });
    });
}

function loginUser(req, user) {
    return new Promise((resolve, reject) => {
        req.logIn(user, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

async function loginWithFreshSession(req, user) {
    await regenerateSession(req);
    await loginUser(req, user);
}

function logoutUser(req) {
    return new Promise((resolve, reject) => {
        req.logout((err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function destroySession(req) {
    return new Promise((resolve) => {
        if (!req.session || typeof req.session.destroy !== 'function') {
            return resolve();
        }

        req.session.destroy(() => resolve());
    });
}

function clearSessionCookie(res) {
    res.clearCookie(getSessionCookieName(), {
        ...buildSessionCookieOptions(),
        maxAge: undefined
    });
}

module.exports = {
    clearSessionCookie,
    destroySession,
    loginWithFreshSession,
    logoutUser
};
