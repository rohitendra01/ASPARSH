const passport = require('passport');
const otpService = require('../services/otpService');
const authService = require('../services/authService'); // Reusing from authController step
const userRepository = require('../repositories/userRepository');
const {
  clearSessionCookie,
  destroySession,
  loginWithFreshSession,
  logoutUser: logoutPassportUser
} = require('../utils/sessionUtils');
const {
  consumeSafeReturnTo,
  storeSafeReturnTo
} = require('../utils/securityUtils');

function getCsrf(req, res) {
  if (typeof req.csrfToken === 'function') return req.csrfToken();
  if (res && res.locals && res.locals.csrfToken) return res.locals.csrfToken;
  return null;
}

function renderLogin(req, res, extraLocals = {}) {
  return res.render('users/login', {
    csrfToken: getCsrf(req, res),
    passwordPolicy: authService.getPasswordPolicyMessage(),
    ...extraLocals
  });
}

function renderOtp(req, res, extraLocals = {}) {
  return res.render('users/otp', {
    csrfToken: getCsrf(req, res),
    ...extraLocals
  });
}

function renderNewPassword(req, res, extraLocals = {}) {
  return res.render('users/new-password', {
    csrfToken: getCsrf(req, res),
    passwordPolicy: authService.getPasswordPolicyMessage(),
    ...extraLocals
  });
}

exports.getLoginPage = (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    req.flash('error_msg', 'You are already logged in');
    return res.redirect('/');
  }
  renderLogin(req, res);
};

exports.loginUser = (req, res, next) => {
  storeSafeReturnTo(req, req.body.returnTo);

  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error_msg', info.message || 'Invalid credentials');
      req.flash('email', req.body.email);
      return res.redirect('/login');
    }
    (async () => {
      try {
        await loginWithFreshSession(req, user);
        await authService.manageLoginSession(user, req.sessionID, req.sessionStore);

        req.flash('success_msg', 'Successfully logged in!');
        const redirectUrl = consumeSafeReturnTo(req, '/');
        res.redirect(redirectUrl);
      } catch (saveErr) {
        return next(saveErr);
      }
    })();
  })(req, res, next);
};

exports.logoutUser = async (req, res) => {
  const user = req.user;

  try {
    await logoutPassportUser(req);
    if (user && user._id) {
      await userRepository.updateUserSession(user._id, null);
    }

    await destroySession(req);
    clearSessionCookie(res);
    return res.redirect('/login');
  } catch (err) {
    req.flash('error_msg', 'Error logging out');
    return res.redirect('/');
  }
};

exports.requestOtp = async (req, res) => {
  const { email } = req.body;
  try {
    await otpService.generateAndSendOtp(email);
    renderOtp(req, res, { email, error_msg: null });
  } catch (err) {
    renderLogin(req, res, { error_msg: err.message, resetEmail: email });
  }
};

exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    await otpService.resendOtp(email);
    renderOtp(req, res, { email, error_msg: null });
  } catch (err) {
    renderLogin(req, res, { error_msg: err.message, resetEmail: email });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    await otpService.verifyOtp(email, otp);
    return renderNewPassword(req, res, { email, error_msg: null });
  } catch (err) {
    if (err.message.includes('expired')) {
      return renderLogin(req, res, { error_msg: err.message, resetEmail: email });
    }
    return renderOtp(req, res, { email, error_msg: err.message });
  }
};

exports.resetPasswordOtp = async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  try {
    if (password !== confirmPassword) {
      return renderNewPassword(req, res, { email, error_msg: 'Passwords do not match.' });
    }

    await otpService.resetPassword(email, password);
    req.flash('success_msg', 'Password reset successful. Please log in.');
    return res.redirect('/login');
  } catch (err) {
    console.error('Error resetting password:', err);
    const message = err.message || 'Error resetting password. Please try again.';

    if (message.includes('Password')) {
      return renderNewPassword(req, res, { email, error_msg: message });
    }

    if (message.includes('Session expired') || message.includes('OTP')) {
      return renderLogin(req, res, { error_msg: message, resetEmail: email });
    }

    return renderLogin(req, res, { error_msg: message, resetEmail: email });
  }
};
