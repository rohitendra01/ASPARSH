const express = require('express');
const router = express.Router({ mergeParams: true });

const reviewController = require('../controllers/reviewController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });


router.get('/new', isLoggedIn, reviewController.renderNewForm);

router.get('/search-profiles', reviewController.searchProfiles);

router.post('/', isLoggedIn, csrfProtection, reviewController.create);

router.get('/', isLoggedIn, reviewController.list);

router.post('/:id/delete', isLoggedIn, csrfProtection, reviewController.delete);


router.get('/:slug', reviewController.show);

router.post('/:slug/api/generate', reviewController.generate);

router.post('/:slug/api/submit', reviewController.submit);

module.exports = router;