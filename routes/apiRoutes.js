const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { isLoggedIn } = require('../middleware/authMiddleware');

router.get('/designs', apiController.getDesigns);

router.get('/skills/search', apiController.searchSkills);

// Profile search scoped to the logged-in admin's tenant
router.get('/profiles/search', isLoggedIn, apiController.searchProfiles);

module.exports = router;
