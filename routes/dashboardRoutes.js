const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

// Dashboard home page
router.get('/', isLoggedIn, dashboardController.dashboardHome);

// User profile page (dashboard)

router.get('/user/view', isLoggedIn, dashboardController.dashboardUserProfile);
router.get('/hotels/index', isLoggedIn, dashboardController.dashboardHotelsIndex);
// Add more dashboard routes here (e.g., /hotels, /portfolio, etc.)

module.exports = router;
