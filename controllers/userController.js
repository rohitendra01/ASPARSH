const userService = require('../services/userService');
const userRepository = require('../repositories/userRepository');
const { getPasswordPolicyMessage } = require('../utils/securityUtils');

exports.viewUserProfile = async (req, res) => {
  try {
    const data = await userService.getUserEcosystemStats(req.params.slug, req.user);

    res.render('users/view', {
      ...data,
      currentUser: req.user,
      layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    console.error('Error viewing user profile:', err);
    res.status(404).send(err.message || 'Admin user not found');
  }
};

exports.renderEditUserProfile = async (req, res) => {
  try {
    const user = req.params.slug
      ? await userRepository.findUserByIdentifier(req.params.slug)
      : req.user;

    if (!user) return res.status(404).send('Admin user not found');

    res.render('users/edit', {
      user,
      currentUser: req.user,
      passwordPolicy: getPasswordPolicyMessage(),
      layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    console.error('Error rendering edit user form:', err);
    res.status(500).send('Error loading page');
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const updatedUser = await userService.processUserUpdate(
      req.params.slug,
      req.body,
      req.file,
      req.user
    );

    req.flash('success_msg', 'Profile updated successfully!');
    return res.redirect(`/dashboard/${updatedUser.slug}/user`);
  } catch (err) {
    console.error('Error updating user profile:', err);
    req.flash('error_msg', err.message || 'Error updating profile');
    const fallback = (req.user && req.user.slug) ? `/dashboard/${req.user.slug}` : '/';
    res.redirect(req.get('Referrer') || fallback);
  }
};
