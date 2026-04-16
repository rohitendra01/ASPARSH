const Hotel = require('../models/Hotel');

/**
 * List all hotels, optionally filtered by profileId.
 * All admins can see all hotels — no tenant isolation.
 */
exports.findAllHotels = (profileId = null) => {
    const query = {};
    if (profileId) query.profileId = profileId;

    return Hotel.find(query)
        .populate('profileId', 'name slug email mobile')
        .populate('createdByAdmin', 'username email')
        .sort({ createdAt: -1 })
        .lean();
};

exports.findPublicHotelBySlug = (slug) => {
    return Hotel.findOne({ slug, status: 'published' })
        .populate('profileId', 'name email mobile')
        .lean();
};

exports.findHotelById = (id) => {
    return Hotel.findOne({ _id: id });
};

exports.findHotelBySlug = (slug) => {
    return Hotel.findOne({ slug });
};

exports.createHotel = (data) => {
    return new Hotel(data).save();
};

exports.updateHotel = async (id, updates, adminId) => {
    const hotel = await Hotel.findOne({ _id: id });
    if (!hotel) throw new Error('Hotel not found');

    Object.assign(hotel, updates);
    hotel._modifiedByAdminId = adminId;

    return hotel.save();
};

exports.softDeleteHotel = async (id) => {
    const hotel = await Hotel.findOne({ _id: id });
    if (!hotel) throw new Error('Hotel not found');

    return hotel.softDelete();
};