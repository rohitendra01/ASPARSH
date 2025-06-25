const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const http = require("http");
const ejsMate = require('ejs-mate');
const server = http.createServer(app);



const path = require("path");
const mongoose = require("mongoose");


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


app.get("/", (req, res) => {
    res.render("index");
});
app.get("/index", (req, res) => {
    res.render("products/index");
});

// Show register page
app.get("/register", (req, res) => {
    res.render("users/register");
});

// Handle register form submission
app.post("/register", (req, res) => {
    // TODO: Save user to DB, validate, etc.
    // Example: console.log(req.body);
    res.redirect("/login");
});

// Show login page
app.get("/login", (req, res) => {
    res.render("users/login"); // Make sure you have users/login.ejs
});

// Handle login form submission
app.post("/login", (req, res) => {
    // TODO: Authenticate user
    // Example: console.log(req.body);
    res.redirect("/");
});



server.listen(3000, () => {
    console.log("Server running on 3000");
});
