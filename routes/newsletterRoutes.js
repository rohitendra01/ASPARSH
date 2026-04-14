const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

router.post('/newsletter-signup', newsletterController.newsletterSignup);

router.post('/newsletter-status', newsletterController.checkSubscriptionStatus);

router.get('/unsubscribe/:token', newsletterController.unsubscribe);

module.exports = router;
