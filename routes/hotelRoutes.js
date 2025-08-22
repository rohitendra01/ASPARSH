const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const hotelController = require('../controllers/hotelController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: false });

router.get('/', isLoggedIn, hotelController.listHotels);

router.get('/new', isLoggedIn, hotelController.renderNewHotelForm);

router.post('/new', isLoggedIn, upload.fields([
  { name: 'hotelLogo', maxCount: 1 },
  { name: 'hotelOfferBanner', maxCount: 1 }
]), csrfProtection, hotelController.createHotel);

router.get('/:hotelSlug/edit', isLoggedIn, hotelController.renderEditHotelForm);

router.post('/:hotelSlug/edit', isLoggedIn, upload.fields([
  { name: 'hotelLogo', maxCount: 1 },
  { name: 'hotelOfferBanner', maxCount: 1 }
]), csrfProtection, hotelController.updateHotel);

router.post('/:hotelSlug/delete', isLoggedIn, upload.none(), csrfProtection, hotelController.deleteHotel);

module.exports = router;
