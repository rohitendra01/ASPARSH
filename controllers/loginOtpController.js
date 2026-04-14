const passport = require('passport');
const otpService = require('../services/otpService');
const authService = require('../services/authService'); // Reusing from authController step

function getCsrf(req, res) {
  if (typeof req.csrfToken === 'function') return req.csrfToken();
  if (res && res.locals && res.locals.csrfToken) return res.locals.csrfToken;
  return null;
}

exports.getLoginPage = (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    req.flash('error_msg', 'You are already logged in');
    return res.redirect('/');
  }
  res.render('users/login', { csrfToken: getCsrf(req, res) });
};

exports.loginUser = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error_msg', info.message || 'Invalid credentials');
      req.flash('email', req.body.email);
      return res.redirect(req.headers.referer || '/');
    }
    req.logIn(user, async (err) => {
      if (err) return next(err);
      try {
        await authService.manageLoginSession(user, req.sessionID, req.sessionStore);

        req.flash('success_msg', 'Successfully logged in!');
        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;
        res.redirect(redirectUrl);
      } catch (saveErr) {
        return next(saveErr);
      }
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
    res.redirect('/');
  });
};

exports.requestOtp = async (req, res) => {
  const { email } = req.body;
  try {
    await otpService.generateAndSendOtp(email);
    res.render('users/otp', { email, error_msg: null, csrfToken: getCsrf(req, res) });
  } catch (err) {
    res.render('users/login', { error_msg: err.message, csrfToken: getCsrf(req, res) });
  }
};

exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    await otpService.resendOtp(email);
    res.render('users/otp', { email, error_msg: null, csrfToken: getCsrf(req, res) });
  } catch (err) {
    res.render('users/login', { error_msg: err.message, csrfToken: getCsrf(req, res) });
  }
};

exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  try {
    otpService.verifyOtp(email, otp);
    return res.render('users/new-password', { email, csrfToken: getCsrf(req, res) });
  } catch (err) {
    if (err.message.includes('expired')) {
      return res.render('users/login', { error_msg: err.message, csrfToken: getCsrf(req, res) });
    }
    return res.render('users/otp', { email, error_msg: err.message, csrfToken: getCsrf(req, res) });
  }
};

exports.resetPasswordOtp = async (req, res) => {
  const { email, password } = req.body;
  try {
    await otpService.resetPassword(email, password);
    req.flash('success_msg', 'Password reset successful. Please log in.');
    return res.redirect('/login');
  } catch (err) {
    console.error('Error resetting password:', err);
    res.render('users/login', { error_msg: err.message || 'Error resetting password. Please try again.', csrfToken: getCsrf(req, res) });
  }
};