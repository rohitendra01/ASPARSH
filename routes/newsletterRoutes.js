const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

router.post('/newsletter-signup', newsletterController.newsletterSignup);

router.get('/newsletter-status', newsletterController.checkSubscriptionStatus);

router.get('/unsubscribe/:token', newsletterController.unsubscribe);

module.exports = router;
