const express = require('express');
const router = express.Router();
const transporter = require('../mailer');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// In-memory store for reset tokens (for demo; use DB in production)
const resetTokens = {};

// Show reset password form (not used, handled by modal)
// router.get('/reset-password', (req, res) => {
//   res.render('users/reset-password');
// });

router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.render('users/login', { error_msg: 'No account with that email.' });
  }
  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  resetTokens[token] = { email, expires: Date.now() + 3600000 };

  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
  try {
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`
    });
    console.log('Reset link sent to:', email, 'URL:', resetUrl);
    res.render('users/login', { error_msg: 'Reset link sent to your email.' });
  } catch (err) {
    console.error('Error sending reset email:', err);
    res.render('users/login', { error_msg: 'Failed to send reset email. Please contact support or try again later.' });
  }
});

// Show new password form
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  const data = resetTokens[token];
  if (!data || data.expires < Date.now()) {
    return res.render('users/login', { error_msg: 'Reset link expired or invalid.' });
  }
  res.render('users/new-password', { token });
});

// Handle new password submission
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const data = resetTokens[token];
  if (!data || data.expires < Date.now()) {
    return res.render('users/login', { error_msg: 'Reset link expired or invalid.' });
  }
  const user = await User.findOne({ email: data.email });
  if (!user) {
    return res.render('users/login', { error_msg: 'User not found.' });
  }
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    user.password = hashedPassword;
    await user.save();
    delete resetTokens[token];
    res.render('users/login', { error_msg: 'Password reset successful. Please log in.' });
  } catch (err) {
    console.error('Error hashing password:', err);
    res.render('users/login', { error_msg: 'Error resetting password. Please try again.' });
  }
});

module.exports = router;
