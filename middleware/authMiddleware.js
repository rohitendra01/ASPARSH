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

exports.enforceSingleSession = (req, res, next) => {
    try {
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
            const stored = req.user.currentSessionId || null;
            const current = req.sessionID || null;
            if (stored && current && stored !== current) {
                try {
                    if (req.sessionStore && typeof req.sessionStore.destroy === 'function') {
                        req.sessionStore.destroy(current, () => {
                        });
                    }
                } catch (e) {
                }
                return req.logout(() => {
                    try {
                        if (req.session) {
                            req.session.destroy(() => {
                                req.flash('error_msg', 'You were logged out because your account was signed in from another device.');
                                return res.redirect('/login');
                            });
                        } else {
                            req.flash('error_msg', 'You were logged out because your account was signed in from another device.');
                            return res.redirect('/login');
                        }
                    } catch (e) {
                        req.flash('error_msg', 'You were logged out because your account was signed in from another device.');
                        return res.redirect('/login');
                    }
                });
            }
        }
    } catch (e) {
    }
    return next();
};