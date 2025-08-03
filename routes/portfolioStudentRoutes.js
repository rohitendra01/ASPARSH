const express = require('express');
const router = express.Router();
const apicache = require('apicache');
const cache = apicache.middleware;

router.get('/student/show', cache('5 minutes'), (req, res) => {
  res.render('portfolios/student/show');
});
router.get('/student/about', cache('5 minutes'), (req, res) => {
  res.render('portfolios/student/about');
});
router.get('/student/services', cache('5 minutes'), (req, res) => {
  res.render('portfolios/student/services');
});
router.get('/student/portfolio', cache('5 minutes'), (req, res) => {
  res.render('portfolios/student/portfolio');
});
router.get('/student/blog', cache('5 minutes'), (req, res) => {
  res.render('portfolios/student/blog');
});
router.get('/student/contact', cache('5 minutes'), (req, res) => {
  res.render('portfolios/student/contact');
});

module.exports = router;
