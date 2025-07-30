const express = require('express');
const router = express.Router();

// GET /portfolio/business/visiting-card
router.get('/visiting-card', (req, res) => {
    res.render('portfolios/business/visiting-card');
});

// GET /portfolio/business/:id
router.get('/:id', (req, res) => {
    // You can fetch business portfolio data here using req.params.id
    // For now, just render the show.ejs page
    res.render('portfolios/business/show');
});

module.exports = router;
