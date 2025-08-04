exports.showHotelPage = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ hotelSlug: req.params.hotelSlug });
    if (!hotel) return res.status(404).send('Hotel not found');
    res.render('hotels/show', {
      hotelId: hotel.hotelId,
      hotelName: hotel.hotelName,
      hotelDescription: hotel.hotelDescription,
      hotelLogo: hotel.hotelLogo,
      hotelOfferBanner: hotel.hotelOfferBanner,
      hotelType: hotel.hotelType,
      foodCategories: hotel.foodCategories || [],
      hotelAddress: hotel.hotelAddress,
      createdByUsername: hotel.createdByUsername
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading hotel show page');
  }
};
const Hotel = require('../models/Hotel');

exports.listHotels = async (req, res) => {
  const hotels = await Hotel.find({});
  res.render('hotels/index', { hotels, user: req.user, layout: 'layouts/dashboard-boilerplate' });
};

exports.renderNewHotelForm = (req, res) => {
  res.render('hotels/new', { layout: 'layouts/dashboard-boilerplate', user: req.user });
};

exports.createHotel = async (req, res) => {
  // ...existing logic from dashboardController.createHotelFromDashboard...
};

exports.renderEditHotelForm = async (req, res) => {
  // ...existing logic from dashboardController.renderEditHotelForm...
};

exports.updateHotel = async (req, res) => {
  // ...existing logic from dashboardController.updateHotel...
};

exports.deleteHotel = async (req, res) => {
  // ...existing logic from dashboardController.deleteHotel...
};
