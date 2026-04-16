const profileRepository = require('../repositories/profileRepository');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');
const { deleteCloudinaryImage } = require('../utils/cloudinaryUtils'); // Created in hotelController step

const Hotel = require('../models/Hotel');
const { Portfolio } = require('../models/Portfolio');
const VisitingCard = require('../models/VisitingCard');
const ReviewLink = require('../models/ReviewLink');

exports.getProfileList = async (searchQuery) => {
    return await profileRepository.findAllProfiles(searchQuery);
};

exports.getProfileEcosystem = async (slug) => {
    const profile = await profileRepository.findProfileBySlug(slug);
    if (!profile) throw new Error('Profile not found.');

    const [hotels, portfolios, visitingCards, reviewLinks] = await Promise.all([
        Hotel.find({ profileId: profile._id }).lean(),
        Portfolio.find({ profileId: profile._id }).populate('design', 'name').lean(),
        VisitingCard.find({ profileId: profile._id }).lean(),
        ReviewLink.find({ profileId: profile._id }).lean()
    ]);

    return { profile, hotels, portfolios, visitingCards, reviewLinks };
};

exports.processProfileCreation = async (data, file, userId) => {
    const address = {
        addressLine: data.addressLine || '',
        city: data.city || '', state: data.state || '',
        country: data.country || '', postcode: data.postcode || ''
    };

    const profileData = {
        ...data, address,
        createdByAdmin: userId,  // audit only — which admin created this profile
        socialLinks: data.socialLinks || [], occupation: data.occupation || '',
        companyName: data.companyName || '', bio: data.bio || '',
        website: data.website || '', whatsapp: data.whatsapp || '',
        category: data.category || '', subcategory: data.subcategory || '',
        experience: data.experience ? Number(data.experience) : 0
    };

    if (file) {
        const upload = await uploadToCloudinary(file.buffer, 'profile', file.mimetype);
        profileData.image = upload.secure_url;
    }

    return await profileRepository.createProfile(profileData);
};

exports.processProfileUpdate = async (slug, data, file, deleteImageFlag, adminId) => {
    const profile = await profileRepository.findProfileDocumentBySlug(slug);
    if (!profile) throw new Error('Profile not found.');

    profile.name = data.name;
    profile.email = data.email;
    profile.mobile = data.mobile;
    profile.address = {
        addressLine: data.addressLine || '',
        city: data.city || '', state: data.state || '',
        country: data.country || '', postcode: data.postcode || ''
    };
    profile.socialLinks = data.socialLinks || [];
    profile.occupation = data.occupation || '';
    profile.companyName = data.companyName || '';
    profile.bio = data.bio || '';
    profile.website = data.website || '';
    profile.whatsapp = data.whatsapp || '';
    profile.category = data.category || '';
    profile.subcategory = data.subcategory || '';
    profile.experience = data.experience ? Number(data.experience) : 0;

    if ((deleteImageFlag || file) && profile.image) {
        await deleteCloudinaryImage(profile.image);
        if (deleteImageFlag) profile.image = '';
    }

    if (file) {
        const upload = await uploadToCloudinary(file.buffer, 'profile', file.mimetype);
        profile.image = upload.secure_url;
    }

    // Store the admin who made this change in version history
    if (adminId) profile._modifiedByAdminId = adminId;

    return await profile.save();
};

exports.processProfileDeletion = async (slug) => {
    const profile = await profileRepository.findProfileBySlug(slug);
    if (!profile) throw new Error('Profile not found.');

    if (profile.image) {
        await deleteCloudinaryImage(profile.image);
    }

    await profileRepository.deleteProfileBySlug(slug);
    return true;
};