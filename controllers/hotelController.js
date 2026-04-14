const hotelService = require('../services/hotelService');
const hotelRepository = require('../repositories/hotelRepository');

exports.listHotels = async (req, res) => {
  try {
    const hotels = await hotelRepository.findHotelsByTenant(null);
    res.render('hotels/index', { hotels, user: req.user, layout: 'layouts/dashboard-boilerplate' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading hotels');
  }
};

exports.renderNewHotelForm = (req, res) => {
  const defaults = {
    hotelAddress: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  };
  res.render('hotels/new', { layout: 'layouts/dashboard-boilerplate', user: req.user, defaults });
};

exports.createHotel = async (req, res) => {
  try {
    const { hotelName, hotelDescription, hotelType, street, city, zipCode } = req.body;
    if (!hotelName || !hotelDescription || !hotelType || !street || !city || !zipCode) {
      return res.status(400).render('hotels/new', { error: 'All required fields must be filled.', layout: 'layouts/dashboard-boilerplate', user: req.user });
    }

    const hotel = await hotelService.processHotelCreation(req.body, req.files, req.user);
    res.redirect(`/hotel/${hotel.hotelSlug}`);
  } catch (err) {
    console.error('Error creating hotel:', err);
    res.status(400).render('hotels/new', { error: err.message || 'Error creating hotel.', layout: 'layouts/dashboard-boilerplate', user: req.user });
  }
};

exports.showHotelPage = async (req, res) => {
  try {
    const hotel = await hotelRepository.findPublicHotelBySlug(req.params.hotelSlug);
    if (!hotel) return res.status(404).send('Hotel not found');
    res.render('hotels/show', {
      ...hotel.toObject(),
      createdByUsername: hotel.createdByAdminUsername || hotel.createdByProfileUsername,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading hotel show page');
  }
};

exports.renderEditHotelForm = async (req, res) => {
  try {
    const hotel = await hotelRepository.findHotelBySlugAndTenant(req.params.hotelSlug, req.user._id);
    if (!hotel) return res.status(404).send('Hotel not found');
    res.render('hotels/edit', { hotel: hotel.toObject(), user: req.user, layout: 'layouts/dashboard-boilerplate' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading hotel edit page');
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const hotel = await hotelService.processHotelUpdate(req.params.hotelSlug, req.body, req.files, req.user);
    res.redirect(`/hotel/${hotel.hotelSlug}`);
  } catch (err) {
    console.error(err);
    const hotel = await hotelRepository.findHotelBySlugAndTenant(req.params.hotelSlug, req.user._id);
    res.status(500).render('hotels/edit', { hotel, user: req.user, layout: 'layouts/dashboard-boilerplate', error: err.message || 'Error updating hotel.' });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    await hotelService.processHotelDeletion(req.params.hotelSlug);
    const hotels = await hotelRepository.findHotelsByTenant(null);
    res.render('hotels/index', { hotels, user: req.user || { slug: '' }, layout: 'layouts/dashboard-boilerplate' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting hotel');
  }
};