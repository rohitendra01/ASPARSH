const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');

// Route: /portfolio/:id - for viewing portfolios by ID
router.get('/student/:id', (req, res, next) => {
  res.render('portfolios/student/show');
});

module.exports = router;