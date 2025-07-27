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
