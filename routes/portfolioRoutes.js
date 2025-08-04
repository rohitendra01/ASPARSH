const express = require('express');
const router = express.Router();
const apicache = require('apicache');
const cache = apicache.middleware;
const portfolioController = require('../controllers/portfolioController');
const { renderEditBusinessPortfolioForm, renderEditStudentPortfolioForm, updatePortfolio, deletePortfolio } = require('../controllers/portfolioController');

const { listPortfolios } = require('../controllers/portfolioController');
const upload = require('../middleware/uploadMiddleware');

const dashboardController = require('../controllers/dashboardController');

// Route: /dashboard/:slug/portfolios/new - create new portfolio form (user-specific)
router.get('/dashboard/:slug/portfolios/new', (req, res) => {
  res.render('portfolios/new', { layout: 'layouts/dashboard-boilerplate', userSlug: req.params.slug });
});

// Route: /dashboard/portfolios/business/new - handle new portfolio creation
router.post('/dashboard/portfolios/business/new', (req, res) => {
  res.send('Portfolio created (stub)');
});
module.exports = router;