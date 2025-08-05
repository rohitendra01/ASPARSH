// Delete hotel (dashboard context)

const express = require('express');
const router = express.Router();
const apicache = require('apicache');
const cache = apicache.middleware;
const { isLoggedIn } = require('../middleware/authMiddleware');
// dashboardController removed
const multer = require('multer');
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');

const storage = multer.memoryStorage();
const upload = multer({ storage });


// Dashboard home page

router.get('/', isLoggedIn, cache('5 minutes'), (req, res) => {
  res.render('dashboard', { layout: 'layouts/dashboard-boilerplate' });
});

// Route for /dashboard/:slug/user to view profile
router.get('/user', isLoggedIn, userController.viewUserProfile);

// Route for /dashboard/:slug/profiles to view all profiles
router.get('/profiles', isLoggedIn, profileController.listProfiles);

// Route for /dashboard/:slug/profiles/new (render form)
router.get('/profiles/new', isLoggedIn, profileController.renderNewProfileForm);

// Route for /dashboard/:slug/profiles/new (handle POST)
router.post('/profiles/new', isLoggedIn, upload.single('image'), profileController.createProfile);

module.exports = router;