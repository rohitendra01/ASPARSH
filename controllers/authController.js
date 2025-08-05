const passport = require('passport');
const adminUser = require('../models/adminUser');

exports.getRegisterPage = (req, res) => {
    res.render("users/register");
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
        req.logIn(user, (err) => {
            if (err) {
                req.flash('error_msg', 'Login after registration failed. Please log in manually.');
                return res.redirect('/login');
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
    res.render("users/login");
};

exports.loginUser = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('error_msg', info.message || 'Invalid credentials');
            req.flash('email', req.body.email); // Repopulate email
            return res.redirect(req.headers.referer || '/');
        }
        
        req.logIn(user, (err) => {
            if (err) return next(err);
            req.flash('success_msg', 'Successfully logged in!');
            
            const redirectUrl = req.session.returnTo || '/';
            delete req.session.returnTo;
            res.redirect(redirectUrl);
        });
    })(req, res, next);
};

exports.logoutUser = (req, res) => {
    req.logout((err) => {
        if (err) {
            req.flash('error_msg', 'Error logging out');
            return res.redirect('/');
        }
        req.flash('success_msg', 'Successfully logged out');
        res.redirect(req.headers.referer || '/');
    });
};