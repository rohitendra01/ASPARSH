const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

// Newsletter signup route
router.post('/newsletter-signup', newsletterController.newsletterSignup);

// Check subscription status
router.post('/newsletter-status', newsletterController.checkSubscriptionStatus);

// Unsubscribe route
router.get('/unsubscribe/:token', newsletterController.unsubscribe);

module.exports = router;
