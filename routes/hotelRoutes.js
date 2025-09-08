const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const hotelController = require('../controllers/hotelController');
// Reuse multer instance exported by controller to avoid duplicate configuration
const { uploadHotelImages } = hotelController;
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

router.get('/', isLoggedIn, hotelController.listHotels);

router.get('/new', isLoggedIn, hotelController.renderNewHotelForm);

router.post('/new', isLoggedIn, uploadHotelImages, csrfProtection, hotelController.createHotel);

router.get('/:hotelSlug/edit', isLoggedIn, hotelController.renderEditHotelForm);

router.post('/:hotelSlug/edit', isLoggedIn, uploadHotelImages, csrfProtection, hotelController.updateHotel);

router.post('/:hotelSlug/delete', isLoggedIn, csrfProtection, hotelController.deleteHotel);

module.exports = router;
