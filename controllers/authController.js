const passport = require('passport');
const adminUser = require('../models/adminUser');

exports.getRegisterPage = (req, res) => {
    // Only call req.csrfToken() if csurf middleware has been applied for this route
    const token = (typeof req.csrfToken === 'function') ? req.csrfToken() : null;
    res.render("users/register", { csrfToken: token });
};

exports.registerUser = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    const errors = {};

    // Validation
    if (!name) errors.name = 'Name is required';
    if (!email) errors.email = 'Email is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';
    if (!password) errors.password = 'Password is required';
    if (password && password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    // Check if email already exists
    if (email && !errors.email) {
        const existingUser = await adminUser.findOne({ email: email.toLowerCase() });
        if (existingUser) errors.email = 'Email already registered';
    }

    // Create username from email if not provided
    let username = name;
    if (!username && email) {
        username = email.split('@')[0];
    }

    // Check if username already exists
    if (username) {
        const existingUsername = await adminUser.findOne({ username });
        if (existingUsername) errors.name = 'Username already taken';
    }

    if (Object.keys(errors).length > 0) {
        req.flash('fieldErrors', errors);
        req.flash('name', name);
        req.flash('email', email);
        return res.redirect('/register');
    }

    try {
        const user = new adminUser({ username, email: email.toLowerCase(), password });
        await user.save();
        req.flash('success_msg', 'Registration successful! You are now logged in.');
        req.logIn(user, async (err) => {
            if (err) {
                req.flash('error_msg', 'Login after registration failed. Please log in manually.');
                return res.redirect('/login');
            }
            try {
                user.currentSessionId = req.sessionID || null;
                await user.save();
            } catch (e) {
                // ignore save errors
            }
            return res.redirect('/');
        });
    } catch (err) {
        req.flash('error_msg', 'Registration failed: ' + err.message);
        req.flash('name', name);
        req.flash('email', email);
        res.redirect('/register');
    }
};

exports.getLoginPage = (req, res) => {
    // Redirect if already logged in
    if (req.isAuthenticated()) {
        req.flash('error_msg', 'You are already logged in');
        return res.redirect('/');
    }
    // Only call req.csrfToken() if csurf middleware has been applied for this route
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
                // Enforce single active session for admin: destroy previous session if exists
                if (user.currentSessionId && req.sessionStore && typeof req.sessionStore.destroy === 'function') {
                    try {
                        await new Promise((resolve) => req.sessionStore.destroy(user.currentSessionId, () => resolve()));
                    } catch (e) {
                        // ignore errors destroying old session
                    }
                }
                // Save the new session id on user
                user.currentSessionId = req.sessionID || null;
                await user.save();

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
    // Clear stored session id for user so they can login from another device
    const user = req.user;
    req.logout(async (err) => {
        if (err) {
            req.flash('error_msg', 'Error logging out');
            return res.redirect('/');
        }
        try {
            if (user && user.currentSessionId) {
                // Only clear if it matches current session (prevents race)
                if (user.currentSessionId === req.sessionID) {
                    user.currentSessionId = null;
                    await user.save();
                }
            }
        } catch (e) {
            // ignore save errors
        }
        req.flash('success_msg', 'Successfully logged out');
        res.redirect(req.headers.referer || '/');
    });
};