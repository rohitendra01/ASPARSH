const express = require('express');
const router = express.Router();
const VisitingCard = require('../models/VisitingCard');
const { isLoggedIn } = require('../middleware/authMiddleware');

// GET /portfolio/business/visiting-card (for logged-in user)
router.get('/visiting-card', isLoggedIn, async (req, res) => {
    try {
        const userId = req.user._id;
        const card = await VisitingCard.findOne({ user: userId });
        if (!card) return res.status(404).send('Visiting card not found');
        res.render('portfolios/business/visiting-card', { card });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading visiting card');
    }
});


// GET /portfolio/business/visiting-card/:userId (public visiting card by userId)
const mongoose = require('mongoose');
router.get('/visiting-card/:userId', async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.isValid(req.params.userId) ? new mongoose.Types.ObjectId(req.params.userId) : null;
        if (!userId) return res.status(400).send('Invalid user ID');
        const card = await VisitingCard.findOne({ user: userId });
        if (!card) return res.status(404).send('Visiting card not found');
        res.render('portfolios/business/visiting-card', { card });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading visiting card');
    }
});

// GET /portfolio/business/:id
router.get('/:id', (req, res) => {
    // You can fetch business portfolio data here using req.params.id
    // For now, just render the show.ejs page
    res.render('portfolios/business/show');
});

module.exports = router;
