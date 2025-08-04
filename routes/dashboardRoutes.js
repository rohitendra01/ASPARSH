// Delete hotel (dashboard context)

const express = require('express');
const router = express.Router();
const apicache = require('apicache');
const cache = apicache.middleware;
const { isLoggedIn } = require('../middleware/authMiddleware');
// dashboardController removed
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });


// Dashboard home page

router.get('/', isLoggedIn, cache('5 minutes'), (req, res) => {
  res.render('dashboard', { layout: 'layouts/dashboard-boilerplate' });
});

module.exports = router;