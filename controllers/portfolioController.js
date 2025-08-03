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

// Stub: Render edit business portfolio form
exports.renderEditBusinessPortfolioForm = (req, res) => {
  res.send('Edit Business Portfolio Form (stub)');
};

// Stub: Render edit student portfolio form
exports.renderEditStudentPortfolioForm = (req, res) => {
  res.send('Edit Student Portfolio Form (stub)');
};

// Stub: Update portfolio
exports.updatePortfolio = (req, res) => {
  res.send('Update Portfolio (stub)');
};

// Stub: Delete portfolio
exports.deletePortfolio = (req, res) => {
  res.send('Delete Portfolio (stub)');
};

// Stub: List portfolios
exports.listPortfolios = (req, res) => {
  res.send('List Portfolios (stub)');
};
