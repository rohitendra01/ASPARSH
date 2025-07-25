const nodemailer = require('nodemailer');
const http = require('http');
const app = require('./app');
require('dotenv').config();


const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("Email server connection error:", error);
    } else {
        console.log("Email server is ready.");
    }
});

module.exports.transporter = transporter;

server.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});