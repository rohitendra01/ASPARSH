const adminUser = require('../models/adminUser');

exports.viewUserProfile = async (req, res) => {
  let user;
  if (req.params.slug) {
    user = await adminUser.findOne({ slug: req.params.slug }) || await adminUser.findById(req.params.slug);
  } else {
    user = req.user;
  }
  if (!user) return res.status(404).send('Admin user not found');
  // Pass both user and currentUser for robust sidebar/profile rendering
  res.render('users/view', { user, currentUser: req.user, layout: 'layouts/dashboard-boilerplate' });
};

exports.renderEditUserProfile = async (req, res) => {
  let user;
  if (req.params.slug) {
    user = await adminUser.findOne({ slug: req.params.slug }) || await adminUser.findById(req.params.slug);
  } else {
    user = req.user;
  }
  if (!user) return res.status(404).send('Admin user not found');
  res.render('users/edit', { user, currentUser: req.user, layout: 'layouts/dashboard-boilerplate' });
};

exports.updateUserProfile = async (req, res) => {
  try {
    let user;
    if (req.params.slug) {
      user = await adminUser.findOne({ slug: req.params.slug }) || await adminUser.findById(req.params.slug);
    } else {
      user = req.user;
    }
    if (!user) return res.status(404).send('Admin user not found');
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
    return res.redirect(`/dashboard/${user.slug}/user`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('back');
  }
};
