const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const hotelRepository = require('../repositories/hotelRepository');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');
const { deleteCloudinaryImage } = require('../utils/cloudinaryUtils');

/**
 * Create a new hotel.
 * - profileId: the customer profile this hotel belongs to (required, stored for data ownership)
 * - createdByAdmin: the logged-in admin ID (stored for audit only)
 */
exports.processHotelCreation = async (data, files, adminUser) => {
    if (!adminUser || !adminUser._id) throw new Error('Admin user required');

    // Resolve the profile this hotel belongs to
    let profile = null;
    if (data.selectedProfileId && mongoose.Types.ObjectId.isValid(data.selectedProfileId)) {
        profile = await Profile.findById(data.selectedProfileId);
    } else if (data.selectedProfileSlug) {
        profile = await Profile.findOne({ slug: data.selectedProfileSlug });
    } else if (data.profileId && mongoose.Types.ObjectId.isValid(data.profileId)) {
        profile = await Profile.findById(data.profileId);
    }
    if (!profile) throw new Error('Selected profile not found. Please select a valid profile.');

    let hotelLogo = '', hotelOfferBanner = '';

    if (files?.hotelLogo?.[0]) {
        const file = files.hotelLogo[0];
        const upload = await uploadToCloudinary(file.buffer, 'hotelLogo', file.mimetype);
        hotelLogo = upload.secure_url;
    }
    if (files?.hotelOfferBanner?.[0]) {
        const file = files.hotelOfferBanner[0];
        const upload = await uploadToCloudinary(file.buffer, 'hotelBanner', file.mimetype);
        hotelOfferBanner = upload.secure_url;
    }

    const amenities = Array.isArray(data.amenities)
        ? data.amenities
        : (data.amenities ? [data.amenities] : []);

    const address = {
        street: data.street || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        zipCode: data.zipCode || ''
    };

    const hotelData = {
        name: data.hotelName || data.name,
        description: data.hotelDescription || data.description || '',
        address,
        amenities,
        hotelLogo,
        hotelOfferBanner,
        profileId: profile._id,        // data ownership — links hotel to customer
        createdByAdmin: adminUser._id  // audit only — who created it
    };

    return hotelRepository.createHotel(hotelData);
};

/**
 * Update an existing hotel.
 * All admins can update any hotel. Admin ID is stored in version history.
 */
exports.processHotelUpdate = async (id, data, files, adminUser) => {
    if (!adminUser || !adminUser._id) throw new Error('Admin user required');

    const hotel = await hotelRepository.findHotelById(id);
    if (!hotel) throw new Error('Hotel not found');

    const updates = {};

    if (data.hotelName || data.name) updates.name = data.hotelName || data.name;
    if (data.hotelDescription || data.description) updates.description = data.hotelDescription || data.description;
    if (data.status) updates.status = data.status;

    if (data.street || data.city || data.state || data.country || data.zipCode) {
        updates.address = {
            street: data.street || hotel.address?.street || '',
            city: data.city || hotel.address?.city || '',
            state: data.state || hotel.address?.state || '',
            country: data.country || hotel.address?.country || '',
            zipCode: data.zipCode || hotel.address?.zipCode || ''
        };
    }

    if (data.amenities) {
        updates.amenities = Array.isArray(data.amenities) ? data.amenities : [data.amenities];
    }

    if (files?.hotelLogo?.[0]) {
        const file = files.hotelLogo[0];
        const upload = await uploadToCloudinary(file.buffer, 'hotelLogo', file.mimetype);
        if (hotel.hotelLogo) await deleteCloudinaryImage(hotel.hotelLogo).catch(() => {});
        updates.hotelLogo = upload.secure_url;
    }

    if (files?.hotelOfferBanner?.[0]) {
        const file = files.hotelOfferBanner[0];
        const upload = await uploadToCloudinary(file.buffer, 'hotelBanner', file.mimetype);
        if (hotel.hotelOfferBanner) await deleteCloudinaryImage(hotel.hotelOfferBanner).catch(() => {});
        updates.hotelOfferBanner = upload.secure_url;
    }

    return hotelRepository.updateHotel(id, updates, adminUser._id);
};

/**
 * Soft-delete a hotel by ID.
 * All admins can delete any hotel.
 */
exports.processHotelDeletion = async (id) => {
    const hotel = await hotelRepository.findHotelById(id);
    if (!hotel) return;

    if (hotel.hotelLogo) await deleteCloudinaryImage(hotel.hotelLogo).catch(() => {});
    if (hotel.hotelOfferBanner) await deleteCloudinaryImage(hotel.hotelOfferBanner).catch(() => {});

    return hotelRepository.softDeleteHotel(id);
};