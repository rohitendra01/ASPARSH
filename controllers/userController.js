const User = require('../models/User');

exports.viewUserProfile = async (req, res) => {
  let user;
  if (req.params.slug) {
    user = await User.findOne({ slug: req.params.slug }) || await User.findById(req.params.slug);
  } else {
    user = req.user;
  }
  if (!user) return res.status(404).send('User not found');
  res.render('users/view', { user, layout: 'layouts/dashboard-boilerplate' });
};

exports.renderEditUserProfile = async (req, res) => {
  let user;
  if (req.params.slug) {
    user = await User.findOne({ slug: req.params.slug }) || await User.findById(req.params.slug);
  } else {
    user = req.user;
  }
  if (!user) return res.status(404).send('User not found');
  res.render('users/edit', { user, layout: 'layouts/dashboard-boilerplate' });
};

exports.updateUserProfile = async (req, res) => {
  try {
    let user;
    if (req.params.slug) {
      user = await User.findOne({ slug: req.params.slug }) || await User.findById(req.params.slug);
    } else {
      user = req.user;
    }
    if (!user) return res.status(404).send('User not found');
    user.username = req.body.username;
    user.email = req.body.email;
    if (req.file) {
      // Upload image to Cloudinary
      const cloudinary = require('cloudinary').v2;
      const streamifier = require('streamifier');
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          folder: 'asparsh/users',
          resource_type: 'image',
          public_id: `user_${user._id}`,
          overwrite: true
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      user.image = result.secure_url;
    }
    await user.save();
    req.flash('success_msg', 'Profile updated successfully!');
    return res.redirect(`/dashboard/user/${user.slug}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('back');
  }
};
