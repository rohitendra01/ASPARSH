const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const http = require("http");
const server = http.createServer(app);



const path = require("path");
const mongoose = require("mongoose");


mongoose.connect("mongodb://localhost:27017/asparsh", {
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});



app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "assets")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get("/", (req, res) => {
    res.render("index");
});
















server.listen(3000, () => {
    console.log("Server running on 3000");
});
