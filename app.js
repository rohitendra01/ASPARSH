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
const bodyParser = require("body-parser");
const ejsMate = require('ejs-mate');
const path = require("path");
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const helmet = require('helmet');
const morgan = require('morgan');
const adminUser = require('./models/adminUser');

const app = express();

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev', {
        skip: (req, res) => {
            return req.originalUrl.startsWith('/assets') ||
                req.originalUrl.startsWith('/css') ||
                req.originalUrl.startsWith('/js');
        }
    }));
}

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.set('trust proxy', true);

app.use(express.static(path.join(__dirname, "public")));
app.use('/assets', express.static(path.join(__dirname, "public", "assets")));
app.use('/assets', express.static(path.join(__dirname, "assets")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const sessionOptions = {
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 60 * 10),
        sameSite: 'lax',
        maxAge: 1000 * 60 * 30
    }
};

let MongoStore;
try {
    MongoStore = require('connect-mongo');
} catch (e) {
    MongoStore = null;
}

if (MongoStore && process.env.NODE_ENV !== 'test') {
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

if (process.env.NODE_ENV === 'test') {
    app.use((req, res, next) => {
        if (!req.session) req.session = {};
        req.session.save = (cb) => cb && cb();
        req.session.destroy = (cb) => cb && cb();
        next();
    });
} else {
    app.use(session(sessionOptions));
}
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

try {
    const { enforceSingleSession } = require('./middleware/authMiddleware');
    app.use(enforceSingleSession);
} catch (e) {
    console.warn('Could not mount enforceSingleSession middleware:', e && e.message);
}

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const emailLower = email.toLowerCase();

        const user = await adminUser.findOne({ email: emailLower }).select('+password');

        if (!user) return done(null, false, { message: 'Incorrect email.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password.' });

        adminUser.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).catch(e => console.error(e));

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

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
    next();
});

try {
    const safeCsrf = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });
    app.use((req, res, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return safeCsrf(req, res, next);
        }
        return next();
    });
} catch (e) {
    console.warn('Could not initialize safe CSRF middleware:', e && e.message);
}

app.use((req, res, next) => {
    try {
        res.locals.csrfToken = (typeof req.csrfToken === 'function') ? req.csrfToken() : null;
    } catch (e) {
        res.locals.csrfToken = null;
    }
    next();
});

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
const apiRoutes = require('./routes/apiRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const streamlineRoutes = require('./routes/streamlineRoutes');
const qrRoutes = require('./routes/qrRoutes');
const qrController = require('./controllers/qrController');
const templateRoutes = require('./routes/templateRoutes');

// Use routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', productRoutes);
app.use('/', newsletterRoutes);
app.use('/dashboard/:slug/portfolios', portfolioRoutes);
app.use('/dashboard/:slug/visiting-cards', visitingCardRoutes);
app.use('/dashboard/:slug/profiles', profileRoutes);
app.use('/dashboard/:slug/hotels', hotelRoutes);
app.use('/dashboard/:slug/user', userRoutes);
app.use('/dashboard/:slug/reviews', reviewRoutes);
app.use('/dashboard/:slug/streamline', streamlineRoutes);
app.use('/dashboard/:slug/qr-codes', qrRoutes);
app.use('/dashboard/:slug', dashboardRoutes);
app.use('/dashboard/:slug/templates', templateRoutes);

app.get('/q/:shortId', qrController.redirect);

app.use('/reviews', reviewRoutes);
app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
    if (!err) return next();

    const isJsonRequest = req.xhr || (req.headers['accept'] || '').toLowerCase().includes('application/json') || req.is('json');

    if (err.code === 'EBADCSRFTOKEN') {
        if (isJsonRequest) return res.status(403).json({ success: false, message: 'Invalid or expired security token.' });
        req.flash('error_msg', 'Your session expired. Please try again.');
        return res.redirect('back');
    }

    if (isJsonRequest) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    res.status(500).send('Internal Server Error');
});

module.exports = app;