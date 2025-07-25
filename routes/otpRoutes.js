const express = require('express');
const router = express.Router();
const transporter = require('../mailer');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// In-memory OTP store (use DB in production)
const otpStore = {};

// Request OTP (from modal)
router.post('/request-otp', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.render('users/login', { error_msg: 'No account with that email.' });
  }
  // Generate OTP
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };

  // Send OTP email
  await transporter.sendMail({
    to: email,
    subject: 'Your OTP for Password Reset',
    html: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
  });

  res.render('users/otp', { email, error_msg: null });
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!otpStore[email]) {
    return res.render('users/login', { error_msg: 'Session expired. Please request again.' });
  }
  // Generate new OTP
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };
  await transporter.sendMail({
    to: email,
    subject: 'Your OTP for Password Reset',
    html: `<p>Your new OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
  });
  res.render('users/otp', { email, error_msg: null });
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record || record.expires < Date.now()) {
    return res.render('users/login', { error_msg: 'OTP expired. Please request again.' });
  }
  if (record.otp !== otp) {
    return res.render('users/otp', { email, error_msg: 'Invalid OTP. Try again.' });
  }
  // OTP verified, show password reset form
  return res.render('users/new-password', { email });
});

// Handle new password
router.post('/reset-password-otp', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.render('users/login', { error_msg: 'User not found.' });
  }
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    user.password = hashedPassword;
    await user.save();
    delete otpStore[email];
    res.render('users/login', { error_msg: 'Password reset successful. Please log in.' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.render('users/login', { error_msg: 'Error resetting password. Please try again.' });
  }
});

module.exports = router;
