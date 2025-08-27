const apicache = require('apicache');
const cache = apicache.middleware;

function cacheBypass(req, res, next) {
    if (req.user || req.session || typeof req.csrfToken === 'function') {
        return apicache.disabled(req, res, next);
    }
    return next();
}

const express = require('express');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const app = express();
const bodyParser = require("body-parser");
const ejsMate = require('ejs-mate');
const path = require("path");
const session = require('express-session');
let MongoStore;
try {
    // prefer connect-mongo v4 style
    MongoStore = require('connect-mongo');
} catch (e) {
    MongoStore = null;
}
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const adminUser = require('./models/adminUser');


app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "assets")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
require('dotenv').config();
app.use(cookieParser());
const sessionOptions = {
    secret: process.env.SESSION_SECRET || 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 10), 
    maxAge: 1000 * 60 * 10
    }
};

// Use Mongo-backed session store when connect-mongo is available and MONGO_URI/ mongoose connection exists
if (MongoStore) {
    try {
        const mongoose = require('mongoose');
        sessionOptions.store = MongoStore.create({
            mongoUrl: process.env.MONGO_URI || (mongoose.connection && mongoose.connection.client && mongoose.connection.client.s.url) || undefined,
            ttl: 10 * 60 
        });
    } catch (e) {
        console.warn('connect-mongo could not be initialized, falling back to default session store');
    }
}

app.use(session(sessionOptions));
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Enforce single-session middleware (forces logout when session id doesn't match stored id)
try {
    const { enforceSingleSession } = require('./middleware/authMiddleware');
    app.use(enforceSingleSession);
} catch (e) {
    console.warn('Could not mount enforceSingleSession middleware:', e && e.message);
}

// Passport config - fixed to use comparePassword method
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        // Convert email to lowercase for case-insensitive search
        const emailLower = email.toLowerCase();
        const user = await adminUser.findOne({ email: emailLower });
        if (!user) return done(null, false, { message: 'Incorrect email.' });
        
        // Fixed to use comparePassword method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password.' });
        
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Passport session serialization
passport.serializeUser((user, done) => {
    try {
        done(null, user.id);
    } catch (err) {
        done(err);
    }
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await adminUser.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});


// Enhanced res.locals middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    res.locals.user = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.errors = req.flash('errors');
    res.locals.fieldErrors = req.flash('fieldErrors')[0] || {};
    res.locals.fieldWarnings = req.flash('fieldWarnings')[0] || {};
    res.locals.returnTo = req.session.returnTo || '/';
    res.locals.name = req.flash('name')[0];
    res.locals.email = req.flash('email')[0];
    // csrfToken is set by a later middleware after csurf has been run for safe GET requests
    next();
});

try {
    const safeCsrf = csurf({ cookie: false });
    app.use((req, res, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return safeCsrf(req, res, next);
        }
        return next();
    });
} catch (e) {
    console.warn('Could not initialize safe CSRF middleware:', e && e.message);
}

// After running safeCsrf on GETs, populate res.locals.csrfToken so views can render it.
app.use((req, res, next) => {
    try {
        res.locals.csrfToken = (typeof req.csrfToken === 'function') ? req.csrfToken() : null;
    } catch (e) {
        res.locals.csrfToken = null;
    }
    next();
});

// Mount API routes
const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

// Import routes
const authRoutes = require('./routes/authRoutes');
const indexRoutes = require('./routes/indexRoutes');
const productRoutes = require('./routes/productRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const visitingCardRoutes = require('./routes/visitingCardRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Use routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', productRoutes);
app.use('/dashboard/:slug', dashboardRoutes);
app.use('/dashboard/:slug/portfolios', portfolioRoutes);
app.use('/dashboard/:slug/visiting-cards', visitingCardRoutes);
app.use('/dashboard/:slug/profiles', profileRoutes);
app.use('/dashboard/:slug/hotels', hotelRoutes);
app.use('/dashboard/:slug/user', userRoutes);

// CSRF error handler - log details to help debug invalid token issues
app.use((err, req, res, next) => {
  if (!err) return next();
  // csurf uses code 'EBADCSRFTOKEN'
  if (err.code === 'EBADCSRFTOKEN' || err.message === 'invalid csrf token') {
    const accept = (req.headers['accept'] || '').toLowerCase();
    if (req.xhr || accept.includes('application/json') || req.is('json')) return res.status(403).json({ error: 'invalid csrf token' });
    return res.status(403).send('Invalid CSRF token');
  }
  return next(err);
});


// Export app for server.js
module.exports = app;