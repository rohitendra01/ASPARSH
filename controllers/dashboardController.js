// Dashboard hotels index page
exports.dashboardHotelsIndex = async (req, res) => {
  try {
    const hotels = await Hotel.find({});
    res.render('hotels/index', {
      hotels,
      layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('hotels/index', {
      error: 'Error loading hotels',
      hotels: [],
      layout: 'layouts/dashboard-boilerplate'
    });
  }
};
// Dashboard home page
exports.dashboardHome = (req, res) => {
  res.render('dashboard', { layout: 'layouts/dashboard-boilerplate' });
};

// Dashboard user profile page
exports.dashboardUserProfile = (req, res) => {
  // You should fetch the user from req.user or DB as needed
  res.render('users/view', { user: req.user, layout: 'layouts/dashboard-boilerplate' });
};
// dashboardController.js
const path = require('path');

const Hotel = require('../models/Hotel');
exports.showHotelPage = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ hotelId: req.params.hotelId });
        if (!hotel) return res.status(404).send('Hotel not found');
        res.render('hotels/show', {
            hotelId: hotel.hotelId,
            hotelName: hotel.hotelName,
            hotelDescription: hotel.hotelDescription,
            hotelLogo: hotel.hotelLogo,
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
