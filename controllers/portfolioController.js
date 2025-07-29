// controllers/portfolioController.js
const User = require('../models/User');
const Hotel = require('../models/Hotel');

// Show a student's portfolio by user ID
exports.showPortfolio = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).render('portfolios/show', { error: 'User not found' });
    }
    // Find hotels created by this user (if any)
    const hotels = await Hotel.find({ createdBy: user._id });
    res.render('portfolios/show', {
      user,
      hotels,
      layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('portfolios/show', { error: 'Error loading portfolio' });
  }
};
