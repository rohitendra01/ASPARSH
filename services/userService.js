const profileRepository = require('../repositories/profileRepository');
const userRepository = require('../repositories/userRepository');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');
const { validatePasswordStrength } = require('../utils/securityUtils');

const Hotel = require('../models/Hotel');
const { Portfolio } = require('../models/Portfolio');
const VisitingCard = require('../models/VisitingCard');
const ReviewLink = require('../models/ReviewLink');

exports.getUserEcosystemStats = async (slug, currentUser) => {
    const user = slug ? await userRepository.findUserByIdentifier(slug) : currentUser;
    if (!user) throw new Error('User not found');

    // Fetch ALL company profiles — no tenant/admin ownership filter
    const profiles = await profileRepository.findAllProfiles();

    const totalProfiles = profiles.length;
    let totalManagedAssets = 0;

    const ecosystemStats = await Promise.all(profiles.map(async (profile) => {
        const query = { profileId: profile._id, isDeleted: false };

        const [portfolioCount, hotelCount, vcardCount, reviewCount] = await Promise.all([
            Portfolio.countDocuments(query),
            Hotel.countDocuments({ profileId: profile._id, isDeleted: false }),
            VisitingCard.countDocuments({ profileId: profile._id, isDeleted: false }),
            ReviewLink.countDocuments(query)
        ]);

        const profileTotal = portfolioCount + hotelCount + vcardCount + reviewCount;
        totalManagedAssets += profileTotal;

        return {
            name: profile.name,
            slug: profile.slug,
            category: profile.category || 'Uncategorized',
            portfolioCount,
            hotelCount,
            vcardCount,
            reviewCount,
            totalAssets: profileTotal
        };
    }));

    ecosystemStats.sort((a, b) => b.totalAssets - a.totalAssets);

    return { user, totalProfiles, totalManagedAssets, ecosystemStats };
};

exports.processUserUpdate = async (slug, data, file, currentUser) => {
    const userToUpdate = slug ? await userRepository.findUserByIdentifier(slug) : currentUser;
    if (!userToUpdate) throw new Error('User not found');

    if (userToUpdate._id.toString() !== currentUser._id.toString()) {
        throw new Error('Unauthorized to edit this user');
    }

    if (data.username) userToUpdate.username = data.username;
    if (data.email) userToUpdate.email = data.email.toLowerCase();

    if (data.password && data.password === data.passwordConfirm) {
        const passwordError = validatePasswordStrength(data.password);
        if (passwordError) {
            throw new Error(passwordError);
        }

        userToUpdate.password = data.password;
    } else if (data.password && data.password !== data.passwordConfirm) {
        throw new Error('Passwords do not match');
    }

    if (file) {
        const upload = await uploadToCloudinary(file.buffer, 'admin-users', file.mimetype);
        userToUpdate.image = upload.secure_url;
    }

    return await userToUpdate.save();
};
