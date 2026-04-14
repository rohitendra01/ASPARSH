exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.session.returnTo = req.originalUrl;
    req.flash('error_msg', 'Please log in to access this page.');
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
    req.flash('error_msg', 'You are already logged in.');
    res.redirect('/dashboard');
};

exports.enforceSingleSession = async (req, res, next) => {
    try {
        if (!req.isAuthenticated() || !req.user) return next();

        const storedSessionId = req.user.currentSessionId;
        const currentSessionId = req.sessionID;

        if (storedSessionId && currentSessionId && storedSessionId !== currentSessionId) {

            if (req.sessionStore && typeof req.sessionStore.destroy === 'function') {
                await new Promise((resolve) => req.sessionStore.destroy(currentSessionId, resolve));
            }

            req.logout((err) => {
                if (err) console.error('Error during forced logout:', err);

                if (req.session) {
                    req.session.destroy(() => {
                        return res.redirect('/login?reason=multidevice');
                    });
                } else {
                    return res.redirect('/login?reason=multidevice');
                }
            });
            return;
        }

        next();
    } catch (error) {
        console.error('Session enforcement error:', error);
        next();
    }
};