const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const hotelRepository = require('../repositories/hotelRepository');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');
const { deleteCloudinaryImage } = require('../utils/cloudinaryUtils');

exports.processHotelCreation = async (data, files, user) => {
    let profile = null;
    if (data.selectedProfileId && mongoose.Types.ObjectId.isValid(data.selectedProfileId)) {
        profile = await Profile.findById(data.selectedProfileId);
    } else if (data.selectedProfileSlug) {
        profile = await Profile.findOne({ slug: data.selectedProfileSlug });
    }
    if (!profile) throw new Error('Selected profile not found. Please select a valid profile.');

    const hotelSlug = data.hotelName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (await hotelRepository.findHotelBySlug(hotelSlug)) {
        throw new Error('A hotel with this name already exists.');
    }

    let hotelLogo, hotelOfferBanner, hotelLogoPublicId, hotelOfferBannerPublicId;

    if (files?.hotelLogo?.[0]) {
        const file = files.hotelLogo[0];
        const upload = await uploadToCloudinary(file.buffer, 'hotelLogo', file.mimetype);
        hotelLogo = upload.secure_url; hotelLogoPublicId = upload.public_id;
    }
    if (files?.hotelOfferBanner?.[0]) {
        const file = files.hotelOfferBanner[0];
        const upload = await uploadToCloudinary(file.buffer, 'hotelBanner', file.mimetype);
        hotelOfferBanner = upload.secure_url; hotelOfferBannerPublicId = upload.public_id;
    }

    const hotelAddress = { street: data.street, city: data.city, state: data.state, country: data.country, zipCode: data.zipCode };
    const hotelData = {
        ...data, hotelAddress, hotelSlug, hotelLogo, hotelOfferBanner, hotelLogoPublicId, hotelOfferBannerPublicId,
        foodCategories: Array.isArray(data.foodCategories) ? data.foodCategories : (data.foodCategories ? [data.foodCategories] : []),
        createdByProfile: profile._id, createdByProfileUsername: profile.slug, createdByProfileName: profile.name,
        createdByAdmin: user?._id, createdByAdminUsername: user?.username
    };

    const hotel = hotelRepository.createHotel(hotelData);
    hotel.versions = [{ changedAt: new Date(), changedBy: user?._id, changedByName: user?.username, changes: {}, snapshot: hotel.toObject() }];

    await hotel.save();
    return hotel;
};

exports.processHotelUpdate = async (slug, data, files, user) => {
    const hotel = await hotelRepository.findHotelBySlug(slug);
    if (!hotel) throw new Error('Hotel not found');
    const original = hotel.toObject();

    if (data.hotelName) hotel.hotelName = data.hotelName;
    if (data.hotelDescription) hotel.hotelDescription = data.hotelDescription;
    if (data.hotelType) hotel.hotelType = data.hotelType;
    if (data.hotelAddress) hotel.hotelAddress = data.hotelAddress;

    if (Array.isArray(data.foodCategories)) {
        hotel.foodCategories = data.foodCategories.map(category => ({
            ...category,
            foodItems: Array.isArray(category.foodItems) ? category.foodItems.map(item => ({
                ...item, price: item.itemPrice !== undefined ? item.itemPrice : item.price
            })) : []
        }));
    } else if (data.foodCategories) {
        hotel.foodCategories = [data.foodCategories];
    }

    if (data.hotelName && data.hotelName !== original.hotelName) {
        const newSlug = data.hotelName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (newSlug !== hotel.hotelSlug && await hotelRepository.findHotelBySlug(newSlug)) {
            throw new Error('A hotel with this name already exists.');
        }
        hotel.hotelSlug = newSlug;
    }

    if (files?.hotelLogo?.[0]) {
        const file = files.hotelLogo[0];
        const upload = await uploadToCloudinary(file.buffer, 'hotelLogo', file.mimetype);
        if (hotel.hotelLogo && hotel.hotelLogo !== upload.secure_url) {
            await deleteCloudinaryImage(hotel.hotelLogoPublicId || hotel.hotelLogo);
        }
        hotel.hotelLogo = upload.secure_url; hotel.hotelLogoPublicId = upload.public_id;
    }

    if (files?.hotelOfferBanner?.[0]) {
        const file = files.hotelOfferBanner[0];
        const upload = await uploadToCloudinary(file.buffer, 'hotelBanner', file.mimetype);
        if (hotel.hotelOfferBanner && hotel.hotelOfferBanner !== upload.secure_url) {
            await deleteCloudinaryImage(hotel.hotelOfferBannerPublicId || hotel.hotelOfferBanner);
        }
        hotel.hotelOfferBanner = upload.secure_url; hotel.hotelOfferBannerPublicId = upload.public_id;
    }

    const changes = {};
    ['hotelName', 'hotelDescription', 'hotelType'].forEach(key => {
        if (original[key] !== hotel[key]) changes[key] = { from: original[key], to: hotel[key] };
    });
    if (JSON.stringify(original.hotelAddress) !== JSON.stringify(hotel.hotelAddress)) changes.hotelAddress = { from: original.hotelAddress, to: hotel.hotelAddress };
    if (JSON.stringify(original.foodCategories || []) !== JSON.stringify(hotel.foodCategories || [])) changes.foodCategories = { from: original.foodCategories || [], to: hotel.foodCategories || [] };

    hotel.updatedBy = user?._id;
    if (!hotel.versions) hotel.versions = [];
    hotel.versions.push({ changedAt: new Date(), changedBy: user?._id, changedByName: user?.username, changes, snapshot: hotel.toObject() });

    await hotel.save();
    return hotel;
};

exports.processHotelDeletion = async (slug) => {
    const hotel = await hotelRepository.findHotelBySlug(slug);
    if (!hotel) return;

    await deleteCloudinaryImage(hotel.hotelLogo);
    await deleteCloudinaryImage(hotel.hotelOfferBanner);

    if (Array.isArray(hotel.foodCategories)) {
        for (const cat of hotel.foodCategories) {
            if (cat?.imagePublicId || cat?.imageUrl) await deleteCloudinaryImage(cat.imagePublicId || cat.imageUrl);
            if (Array.isArray(cat?.foodItems)) {
                for (const item of cat.foodItems) {
                    if (item?.imagePublicId || item?.imageUrl) await deleteCloudinaryImage(item.imagePublicId || item.imageUrl);
                }
            }
        }
    }
    await hotelRepository.deleteHotelBySlug(slug);
};