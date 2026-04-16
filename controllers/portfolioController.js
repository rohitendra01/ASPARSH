const portfolioRepository = require('../repositories/portfolioRepository');
const portfolioService = require('../services/portfolioService');
const Profile = require('../models/Profile');

const getCsrfToken = (req, res) => {
    let token;
    try { if (typeof req.csrfToken === 'function') token = req.csrfToken(); } catch (e) { }
    return token || (res?.locals?.csrfToken);
};

exports.listPortfolios = async (req, res) => {
    try {
        const portfolios = await portfolioRepository.findAllPortfolios();
        res.render('portfolios/index', { user: req.user || null, portfolios, layout: 'layouts/dashboard-boilerplate' });
    } catch (err) {
        console.error('Error listing portfolios:', err);
        res.status(500).send('Error retrieving portfolios');
    }
};

exports.showCreateForm = async (req, res) => {
    try {
        const profile = req.params?.slug
            ? await require('../repositories/profileRepository').findProfileDocumentBySlugAndTenant(req.params.slug)
            : null;
        res.render('portfolios/new', {
            user: req.user || null, slug: req.params?.slug, profile,
            layout: 'layouts/dashboard-boilerplate', csrfToken: getCsrfToken(req, res)
        });
    } catch (err) {
        console.error('Error rendering portfolio form:', err);
        res.status(500).send('Error rendering form');
    }
};

exports.showPortfolio = async (req, res) => {
    try {
        const portfolio = await portfolioRepository.findPublicPortfolioBySlug(req.params.slug);
        if (!portfolio || !portfolio.design) {
            return res.status(404).render('error', { title: 'Not Found', message: 'Portfolio or Design not found.', statusCode: 404 });
        }
        res.render(portfolio.design.templatePath, { title: `${portfolio.name} - Portfolio`, portfolio });
    } catch (error) {
        console.error('Error rendering portfolio:', error);
        res.status(500).render('error', { title: 'Server Error', message: 'Error loading portfolio.', statusCode: 500, error: error.message });
    }
};

exports.createPortfolio = async (req, res) => {
    try {
        const { portfolio, dynamicLinkDoc } = await portfolioService.processPortfolioCreation(req.body, req.files, req.user?._id);

        if (dynamicLinkDoc) {
            dynamicLinkDoc.destinationUrl = `${req.protocol}://${req.get('host')}${dynamicLinkDoc.destinationUrl}`;
            dynamicLinkDoc._modifiedByAdminId = req.user?._id;
            await dynamicLinkDoc.save();
        }

        const isJsonRequest = req.xhr || (req.headers['accept'] || '').toLowerCase().includes('application/json') || req.is('json');
        if (isJsonRequest) {
            return res.json({ success: true, portfolio, slug: portfolio.slug, message: 'Portfolio created successfully' });
        }
        res.redirect(`/portfolio/${portfolio.slug}`);

    } catch (err) {
        console.error('Error creating portfolio:', err);
        const isJsonRequest = req.xhr || (req.headers['accept'] || '').toLowerCase().includes('application/json') || req.is('json');
        if (isJsonRequest) {
            return res.status(400).json({ success: false, message: 'Error creating portfolio', error: err.message });
        }
        res.status(500).send('Error creating portfolio: ' + err.message);
    }
};

exports.getPortfolioBySlug = async (req, res) => {
    try {
        const portfolio = await portfolioRepository.findPublicPortfolioBySlug(req.params.slug);
        if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });
        res.json({ success: true, portfolio });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.updatePortfolio = async (req, res) => {
    try {
        const portfolio = await portfolioRepository.updatePortfolio(req.params.id, req.body, req.user._id);
        if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });
        res.json({ success: true, portfolio, message: 'Portfolio updated successfully' });
    } catch (error) {
        console.error('Error updating portfolio:', error);
        res.status(500).json({ success: false, message: 'Error updating portfolio', error: error.message });
    }
};

exports.deletePortfolio = async (req, res) => {
    try {
        await portfolioService.processPortfolioDeletion(req.params.id);
        res.json({ success: true, message: 'Portfolio deleted successfully' });
    } catch (error) {
        res.status(error.message === 'Portfolio not found' ? 404 : 500).json({
            success: false, message: 'Error deleting portfolio', error: error.message
        });
    }
};

/**
 * List all portfolios belonging to a specific profile.
 */
exports.listPortfoliosByProfile = async (req, res) => {
    try {
        const portfolios = await portfolioRepository.findAllPortfolios(req.params.profileId);
        res.json({ success: true, count: portfolios.length, portfolios });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error listing portfolios', error: error.message });
    }
};