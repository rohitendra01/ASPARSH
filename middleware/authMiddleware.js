exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.session.returnTo = req.originalUrl;
    req.flash('error_msg', 'Please log in first');
    res.redirect('/login');
};

exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
};

exports.isGuest = (req, res, next) => {
    if (!req.isAuthenticated()) return next();
    req.flash('error_msg', 'You are already logged in');
    res.redirect('/');
};