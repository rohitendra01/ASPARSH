const Hotel = require('../models/Hotel');

// tenantId param kept for API compat but no longer used to filter
exports.findHotelsByTenant = (tenantId, profileId = null) => {
    const query = {};
    if (profileId) query.createdByProfile = profileId;

    return Hotel.find(query)
        .populate('createdByProfile', 'name slug')
        .sort({ createdAt: -1 })
        .lean();
};

exports.findPublicHotelBySlug = (slug) => {
    return Hotel.findOne({ slug, status: 'published' })
        .populate('createdByProfile', 'name email mobile')
        .lean();
};

// tenantId param kept for API compat but ownership is no longer checked
exports.findHotelByIdAndTenant = (id, tenantId) => {
    return Hotel.findOne({ _id: id });
};

// tenantId param kept for API compat but ownership is no longer checked
exports.findHotelBySlugAndTenant = (slug, tenantId) => {
    return Hotel.findOne({ slug });
};

exports.createHotel = (data) => {
    return new Hotel(data).save();
};

exports.updateHotel = async (id, tenantId, updates, adminId) => {
    // tenantId ownership check removed — all admins can edit any hotel
    const hotel = await Hotel.findOne({ _id: id });
    if (!hotel) throw new Error('Hotel not found');

    Object.assign(hotel, updates);

    hotel._modifiedByAdminId = adminId;

    return hotel.save();
};

exports.softDeleteHotel = async (id, tenantId) => {
    // tenantId ownership check removed — all admins can delete any hotel
    const hotel = await Hotel.findOne({ _id: id });
    if (!hotel) throw new Error('Hotel not found');

    return hotel.softDelete();
};