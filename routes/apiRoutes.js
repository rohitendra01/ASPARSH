const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.get('/designs', apiController.getDesigns);

router.get('/skills/search', apiController.searchSkills);

router.get('/profiles/search', apiController.searchProfiles);

module.exports = router;
