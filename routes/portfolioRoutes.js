const express = require('express');
const router = express.Router();
const apicache = require('apicache');
const cache = apicache.middleware;
const portfolioController = require('../controllers/portfolioController');
const { renderEditBusinessPortfolioForm, renderEditStudentPortfolioForm, updatePortfolio, deletePortfolio } = require('../controllers/portfolioController');

const { listPortfolios } = require('../controllers/portfolioController');
const upload = require('../middleware/uploadMiddleware');

// Business portfolio edit form
router.get('/business/:portfolioSlug/edit', cache('5 minutes'), renderEditBusinessPortfolioForm);
router.post('/business/:portfolioSlug/edit', upload.fields([
  { name: 'portfolioLogo', maxCount: 1 },
  { name: 'portfolioBanner', maxCount: 1 }
]), updatePortfolio);
router.post('/business/:portfolioSlug/delete', deletePortfolio);

// Student portfolio edit form
router.get('/student/:portfolioSlug/edit', cache('5 minutes'), renderEditStudentPortfolioForm);
router.post('/student/:portfolioSlug/edit', upload.fields([
  { name: 'portfolioLogo', maxCount: 1 },
  { name: 'portfolioBanner', maxCount: 1 }
]), updatePortfolio);
router.post('/student/:portfolioSlug/delete', deletePortfolio);

// Route: /portfolio/:id - for viewing portfolios by ID
router.get('/student/:id', (req, res, next) => {
  res.render('portfolios/student/show');
});

// Portfolio index route for dashboard
const dashboardController = require('../controllers/dashboardController');

// Route: /portfolio - business portfolio index with search
router.get('/portfolio', dashboardController.dashboardPortfolioIndex);

// Route: /dashboard/portfolios/business/new - create new portfolio form
// Route: /dashboard/:slug/portfolios/new - create new portfolio form (user-specific)
router.get('/dashboard/:slug/portfolios/new', (req, res) => {
  res.render('portfolios/new', { layout: 'layouts/dashboard-boilerplate', userSlug: req.params.slug });
});

// Route: /dashboard/portfolios/business/new - handle new portfolio creation
router.post('/dashboard/portfolios/business/new', (req, res) => {
  // TODO: Implement portfolio creation logic
  res.send('Portfolio created (stub)');
});
module.exports = router;