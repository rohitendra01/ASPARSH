const passport = require('passport');
const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const {
    clearSessionCookie,
    destroySession,
    loginWithFreshSession,
    logoutUser: logoutPassportUser
} = require('../utils/sessionUtils');
const {
    consumeSafeReturnTo,
    storeSafeReturnTo
} = require('../utils/securityUtils');

exports.getRegisterPage = (req, res) => {
    const token = (typeof req.csrfToken === 'function') ? req.csrfToken() : null;
    res.render("users/register", {
        csrfToken: token,
        passwordPolicy: authService.getPasswordPolicyMessage()
    });
};

exports.registerUser = async (req, res) => {
    try {
        const result = await authService.validateAndRegisterUser(req.body);

        if (!result.success) {
            req.flash('error_msg', 'Registration failed. Please check your inputs.');
            req.flash('fieldErrors', result.errors);
            req.flash('name', req.body.name);
            req.flash('email', req.body.email);
            return res.redirect('/register');
        }

        try {
            await loginWithFreshSession(req, result.user);
            req.flash('success_msg', 'Registration successful! You are now logged in.');
            await userRepository.updateUserSession(result.user._id, req.sessionID || null);
            return res.redirect('/');
        } catch (err) {
            req.flash('error_msg', 'Login after registration failed. Please log in manually.');
            return res.redirect('/login');
        }
    } catch (err) {
        req.flash('error_msg', 'Registration failed: ' + err.message);
        res.redirect('/register');
    }
};

exports.getLoginPage = (req, res) => {
    if (req.isAuthenticated()) {
        req.flash('error_msg', 'You are already logged in');
        return res.redirect('/');
    }
    const token = (typeof req.csrfToken === 'function') ? req.csrfToken() : null;
    res.render("users/login", {
        csrfToken: token,
        passwordPolicy: authService.getPasswordPolicyMessage()
    });
};

exports.loginUser = (req, res, next) => {
    storeSafeReturnTo(req, req.body.returnTo);

    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('error_msg', info && info.message ? info.message : 'Invalid credentials');
            return res.redirect('/login');
        }

        (async () => {
            try {
                await loginWithFreshSession(req, user);
                await authService.manageLoginSession(user, req.sessionID, req.sessionStore);

                req.flash('success_msg', 'Successfully logged in!');
                const redirectUrl = consumeSafeReturnTo(req, '/');
                res.redirect(redirectUrl);
            } catch (saveErr) {
                return next(saveErr);
            }
        })();
    })(req, res, next);
};

exports.logoutUser = async (req, res) => {
    const user = req.user;
    try {
        await logoutPassportUser(req);
        if (user && user.currentSessionId === req.sessionID) {
            await userRepository.updateUserSession(user._id, null);
        }

        await destroySession(req);
        clearSessionCookie(res);
        return res.redirect('/login');
    } catch (err) {
        req.flash('error_msg', 'Error logging out');
        return res.redirect('/');
    }
};
