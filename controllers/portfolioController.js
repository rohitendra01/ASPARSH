// Render form to create a new visiting card
exports.renderNewVisitingCardForm = (req, res) => {
  res.render('portfolios/business/new', { layout: 'layouts/dashboard-boilerplate', currentUser: req.user });
};

// Handle form submission to create a new visiting card
exports.createVisitingCard = async (req, res) => {
  try {
    const { name, title, description, email, phone, address, website, linkedin, twitter, facebook, instagram } = req.body;
    const visitingCard = new VisitingCard({
      user: req.adminUser._id, // Updated to use adminUser model
      name,
      title,
      description,
      email,
      phone,
      address,
      website,
      linkedin,
      twitter,
      facebook,
      instagram
    });
    await visitingCard.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('portfolios/business/new', { error: 'Error creating visiting card', layout: 'layouts/dashboard-boilerplate' });
  }
};

// Fetch and show visiting card by user ID
exports.showVisitingCard = async (req, res) => {
  try {
    const visitingCard = await VisitingCard.findById(req.params.cardId);
    if (!visitingCard) return res.status(404).send('Visiting card not found');
    res.render('portfolios/business/visiting-card', { card: visitingCard });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading visiting card');
  }
};

// Dashboard business portfolio index page
exports.dashboardPortfolioIndex = async (req, res) => {
  try {
    let query = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = { $or: [ { name: searchRegex }, { slug: searchRegex } ] };
    }
    const cards = await VisitingCard.find(query);
    let slug = req.user && req.user.slug ? req.user.slug : '';
    // Ensure slug is never empty
    if (!slug && req.user) slug = req.user._id ? req.user._id.toString() : '';
    res.render('portfolios/index', { cards, layout: 'layouts/dashboard-boilerplate', slug });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading business visiting cards');
  }
};
const Portfolio = require('../models/Portfolio');

exports.listPortfolios = async (req, res) => {
  // List all portfolios for the user
  const portfolios = await Portfolio.find({ slug: req.params.slug });
  res.render('portfolios/index', { portfolios, slug: req.params.slug, layout: 'layouts/dashboard' });
};

exports.renderNewForm = async (req, res) => {
  // Render form to create a new portfolio
  res.render('portfolios/new', { slug: req.params.slug, layout: 'layouts/dashboard' });
};

exports.createPortfolio = async (req, res) => {
  // Create a new portfolio for the user
  const portfolio = new Portfolio({ ...req.body, slug: req.params.slug });
  await portfolio.save();
  res.redirect(`/dashboard/${req.params.slug}/portfolios`);
};

exports.showPortfolio = async (req, res) => {
  // Show a single portfolio
  const portfolio = await Portfolio.findById(req.params.id);
  res.render('portfolios/show', { portfolio, slug: req.params.slug, layout: 'layouts/dashboard' });
};

exports.renderEditForm = async (req, res) => {
  // Render form to edit a portfolio
  const portfolio = await Portfolio.findById(req.params.id);
  res.render('portfolios/edit', { portfolio, slug: req.params.slug, layout: 'layouts/dashboard' });
};

exports.updatePortfolio = async (req, res) => {
  // Update a portfolio
  await Portfolio.findByIdAndUpdate(req.params.id, req.body);
  res.redirect(`/dashboard/${req.params.slug}/portfolios`);
};

exports.deletePortfolio = async (req, res) => {
  // Delete a portfolio
  await Portfolio.findByIdAndDelete(req.params.id);
  res.redirect(`/dashboard/${req.params.slug}/portfolios`);
};
