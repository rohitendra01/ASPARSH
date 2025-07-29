const express = require('express');
const router = express.Router();

router.get('/student/show', (req, res) => {
  res.render('portfolios/student/show');
});
router.get('/student/about', (req, res) => {
  res.render('portfolios/student/about');
});
router.get('/student/services', (req, res) => {
  res.render('portfolios/student/services');
});
router.get('/student/portfolio', (req, res) => {
  res.render('portfolios/student/portfolio');
});
router.get('/student/blog', (req, res) => {
  res.render('portfolios/student/blog');
});
router.get('/student/contact', (req, res) => {
  res.render('portfolios/student/contact');
});

module.exports = router;
