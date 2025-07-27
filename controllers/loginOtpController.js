const User = require('../models/User');
const transporter = require('../mailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// In-memory OTP store (use DB in production)
const otpStore = {};

exports.getLoginPage = (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    req.flash('error_msg', 'You are already logged in');
    return res.redirect('/');
  }
  res.render('users/login');
};

exports.loginUser = (req, res, next) => {
  const passport = require('passport');
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error_msg', info.message || 'Invalid credentials');
      req.flash('email', req.body.email);
      return res.redirect(req.headers.referer || '/');
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.flash('success_msg', 'Successfully logged in!');
      const redirectUrl = req.session.returnTo || '/';
      delete req.session.returnTo;
      res.redirect(redirectUrl);
    });
  })(req, res, next);
};

exports.logoutUser = (req, res) => {
  req.logout((err) => {
    if (err) {
      req.flash('error_msg', 'Error logging out');
      return res.redirect('/');
    }
    req.flash('success_msg', 'Successfully logged out');
    res.redirect(req.headers.referer || '/');
  });
};

// OTP Request
exports.requestOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.render('users/login', { error_msg: 'No account with that email.' });
  }
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };
  await transporter.sendMail({
    to: email,
    subject: 'Your OTP for Password Reset',
    html: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
  });
  res.render('users/otp', { email, error_msg: null });
};

// OTP Resend
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!otpStore[email]) {
    return res.render('users/login', { error_msg: 'Session expired. Please request again.' });
  }
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };
  await transporter.sendMail({
    to: email,
    subject: 'Your OTP for Password Reset',
    html: `<p>Your new OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
  });
  res.render('users/otp', { email, error_msg: null });
};

// OTP Verify
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record || record.expires < Date.now()) {
    return res.render('users/login', { error_msg: 'OTP expired. Please request again.' });
  }
  if (record.otp !== otp) {
    return res.render('users/otp', { email, error_msg: 'Invalid OTP. Try again.' });
  }
  return res.render('users/new-password', { email });
};

// Password Reset via OTP
exports.resetPasswordOtp = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.render('users/login', { error_msg: 'User not found.' });
  }
  try {
    user.password = password;
    await user.save();
    delete otpStore[email];
    req.flash('success_msg', 'Password reset successful. Please log in.');
    return res.redirect('/login');
  } catch (err) {
    console.error('Error resetting password:', err);
    res.render('users/login', { error_msg: 'Error resetting password. Please try again.' });
  }
};
