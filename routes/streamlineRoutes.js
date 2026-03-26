const express = require('express');
const router = express.Router();
const streamlineController = require('../controllers/streamlineController');
const { isLoggedIn } = require('../middleware/authMiddleware');

router.get('/dashboard', isLoggedIn, streamlineController.renderDashboard);
router.post('/quick-create', isLoggedIn, streamlineController.quickCreate);

module.exports = router;
