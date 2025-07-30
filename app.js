require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const ejsMate = require('ejs-mate');
const path = require("path");
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');


app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "assets")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport config - fixed to use comparePassword method
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        // Convert email to lowercase for case-insensitive search
        const emailLower = email.toLowerCase();
        const user = await User.findOne({ email: emailLower });
        if (!user) return done(null, false, { message: 'Incorrect email.' });
        
        // Fixed to use comparePassword method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password.' });
        
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Enhanced res.locals middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
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

// Import routes
const authRoutes = require('./routes/authRoutes');
const indexRoutes = require('./routes/indexRoutes');
const productRoutes = require('./routes/productRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');

const portfolioStudentRoutes = require('./routes/portfolioStudentRoutes');
const businessPortfolioRoutes = require('./routes/businessPortfolioRoutes');

// Use routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', productRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/portfolio', portfolioStudentRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/portfolios/business', businessPortfolioRoutes);
// All OTP and login logic is now handled by loginOtpController via /auth routes
// Password reset logic is now handled by loginOtpController via /auth routes

// Export app for server.js
module.exports = app;