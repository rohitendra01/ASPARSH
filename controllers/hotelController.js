const hotelService = require('../services/hotelService');
const hotelRepository = require('../repositories/hotelRepository');

exports.listHotels = async (req, res) => {
    try {
        const hotels = await hotelRepository.findAllHotels();
        res.render('hotels/index', { hotels, user: req.user, layout: 'layouts/dashboard-boilerplate' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading hotels');
    }
};

exports.renderNewHotelForm = (req, res) => {
    const defaults = {
        address: { street: '', city: '', state: '', country: '', zipCode: '' }
    };
    res.render('hotels/new', { layout: 'layouts/dashboard-boilerplate', user: req.user, defaults });
};

exports.createHotel = async (req, res) => {
    try {
        const { hotelName, hotelDescription, street, city, zipCode } = req.body;
        if (!hotelName || !street || !city || !zipCode) {
            return res.status(400).render('hotels/new', {
                error: 'Hotel name, street, city and zip code are required.',
                layout: 'layouts/dashboard-boilerplate',
                user: req.user,
                defaults: { address: { street, city, zipCode } }
            });
        }
        if (!req.body.profileId && !req.body.selectedProfileId && !req.body.selectedProfileSlug) {
            return res.status(400).render('hotels/new', {
                error: 'Please select a customer profile.',
                layout: 'layouts/dashboard-boilerplate',
                user: req.user,
                defaults: {}
            });
        }

        const hotel = await hotelService.processHotelCreation(req.body, req.files, req.user);
        res.redirect(`/hotel/${hotel.slug}`);
    } catch (err) {
        console.error('Error creating hotel:', err);
        res.status(400).render('hotels/new', {
            error: err.message || 'Error creating hotel.',
            layout: 'layouts/dashboard-boilerplate',
            user: req.user,
            defaults: {}
        });
    }
};

exports.showHotelPage = async (req, res) => {
    try {
        const hotel = await hotelRepository.findPublicHotelBySlug(req.params.hotelSlug);
        if (!hotel) return res.status(404).send('Hotel not found');
        res.render('hotels/show', { hotel, user: req.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading hotel show page');
    }
};

exports.renderEditHotelForm = async (req, res) => {
    try {
        // Both by id and by slug are supported
        const hotel = req.params.hotelId
            ? await hotelRepository.findHotelById(req.params.hotelId)
            : await hotelRepository.findHotelBySlug(req.params.hotelSlug);
        if (!hotel) return res.status(404).send('Hotel not found');
        res.render('hotels/edit', { hotel: hotel.toObject ? hotel.toObject() : hotel, user: req.user, layout: 'layouts/dashboard-boilerplate' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading hotel edit page');
    }
};

exports.updateHotel = async (req, res) => {
    try {
        // Find by slug first to get the ID
        const existing = req.params.hotelId
            ? await hotelRepository.findHotelById(req.params.hotelId)
            : await hotelRepository.findHotelBySlug(req.params.hotelSlug);
        if (!existing) return res.status(404).send('Hotel not found');

        const hotel = await hotelService.processHotelUpdate(existing._id.toString(), req.body, req.files, req.user);
        res.redirect(`/hotel/${hotel.slug}`);
    } catch (err) {
        console.error(err);
        res.status(500).render('hotels/edit', {
            hotel: req.body,
            user: req.user,
            layout: 'layouts/dashboard-boilerplate',
            error: err.message || 'Error updating hotel.'
        });
    }
};

exports.deleteHotel = async (req, res) => {
    try {
        const existing = req.params.hotelId
            ? await hotelRepository.findHotelById(req.params.hotelId)
            : await hotelRepository.findHotelBySlug(req.params.hotelSlug);
        if (!existing) return res.status(404).send('Hotel not found');

        await hotelService.processHotelDeletion(existing._id.toString());

        const hotels = await hotelRepository.findAllHotels();
        res.render('hotels/index', { hotels, user: req.user || {}, layout: 'layouts/dashboard-boilerplate' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting hotel');
    }
};