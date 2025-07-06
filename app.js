const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const http = require("http");
const ejsMate = require('ejs-mate');
const server = http.createServer(app);



const path = require("path");
const mongoose = require("mongoose");
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');


mongoose.connect("mongodb://localhost:27017/asparsh", {
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "assets")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Session middleware
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport config
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: 'Incorrect email.' });
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// Make user and flash available in all templates
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});


app.get("/", (req, res) => {
    res.render("index");
});
app.get("/products/index", (req, res) => {
    res.render("products/index");
});

// Show register page
app.get("/register", (req, res) => {
    res.render("users/register");
});

// Handle register form submission
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = new User({ name, email, password });
        await user.save();
        req.login(user, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome!');
            res.redirect('/');
        });
    } catch (e) {
        req.flash('error', 'Email already registered.');
        res.redirect('/register');
    }
});

// Show login page
app.get("/login", (req, res) => {
    res.render("users/login"); // Make sure you have users/login.ejs
});

// Handle login form submission
app.post("/login", passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => {
    req.flash('success', 'Welcome back!');
    res.redirect('/');
});

app.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success', 'Logged out successfully.');
        res.redirect('/');
    });
});



server.listen(3000, () => {
    console.log("Server running on 3000");
});
