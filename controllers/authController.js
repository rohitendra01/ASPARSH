const passport = require('passport');
const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');

exports.getRegisterPage = (req, res) => {
    const token = (typeof req.csrfToken === 'function') ? req.csrfToken() : null;
    res.render("users/register", { csrfToken: token });
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

        req.flash('success_msg', 'Registration successful! You are now logged in.');

        req.logIn(result.user, async (err) => {
            if (err) {
                req.flash('error_msg', 'Login after registration failed. Please log in manually.');
                return res.redirect('/login');
            }
            await userRepository.updateUserSession(result.user._id, req.sessionID || null);
            return res.redirect('/');
        });
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
    res.render("users/login", { csrfToken: token });
};

exports.loginUser = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.redirect(req.headers.referer || '/');
        }

        req.logIn(user, async (err) => {
            if (err) return next(err);
            try {
                await authService.manageLoginSession(user, req.sessionID, req.sessionStore);

                req.flash('success_msg', 'Successfully logged in!');
                const redirectUrl = req.session.returnTo || '/';
                delete req.session.returnTo;
                res.redirect(redirectUrl);
            } catch (saveErr) {
                return next(saveErr);
            }
        });
    })(req, res, next);
};

exports.logoutUser = (req, res) => {
    const user = req.user;
    req.logout(async (err) => {
        if (err) {
            req.flash('error_msg', 'Error logging out');
            return res.redirect('/');
        }
        if (user && user.currentSessionId === req.sessionID) {
            await userRepository.updateUserSession(user._id, null);
        }
        req.flash('success_msg', 'Successfully logged out');
        res.redirect(req.headers.referer || '/');
    });
};