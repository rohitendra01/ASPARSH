require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

// In test environments we skip connection verification to avoid opening network
// connections that keep the process alive after tests complete.
if (process.env.NODE_ENV !== 'test') {
    transporter.verify((error, success) => {
        if (error) {
            console.error('Email server connection error:', error);
        } else {
            console.log('Email server is ready.');
        }
    });
}

module.exports = transporter;
