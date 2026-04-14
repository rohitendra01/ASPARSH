const express = require('express');
const router = express.Router({ mergeParams: true });
const { isLoggedIn } = require('../middleware/authMiddleware');
const portfolioController = require('../controllers/portfolioController');
const { upload } = require('../middleware/uploadMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

const portfolioUploads = upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'aboutImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
]);

router.get('/', isLoggedIn, portfolioController.listPortfolios);

router.get('/new', isLoggedIn, portfolioController.showCreateForm);

router.post('/new', isLoggedIn, portfolioUploads, csrfProtection, portfolioController.createPortfolio);

router.get('/:slug', portfolioController.getPortfolioBySlug);

module.exports = router;