const Profile = require('../models/Profile');

exports.findAllProfiles = (searchQuery = null, limit = null) => {
    const query = {};

    if (searchQuery) {
        query.$or = [
            { name: { $regex: searchQuery, $options: 'i' } },
            { slug: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
        ];
    }

    let dbQuery = Profile.find(query).sort({ createdAt: -1 });
    if (limit) dbQuery = dbQuery.limit(limit);

    return dbQuery.lean();
};

/**
 * Keyword search across all profiles — used by AJAX pickers.
 * All admins can search all profiles.
 */
exports.searchProfilesByKeyword = (keyword, limit = 8) => {
    const regex = { $regex: keyword.trim(), $options: 'i' };
    const query = {
        $or: [
            { name: regex },
            { email: regex },
            { mobile: regex },
            { slug: regex },
            { occupation: regex }
        ]
    };

    return Profile.find(query)
        .select('_id name slug email mobile occupation image category')
        .sort({ name: 1 })
        .limit(limit)
        .lean();
};

exports.findPublicProfileBySlug = (slug) => {
    return Profile.findOne({ slug, status: 'published' }).lean();
};

exports.findProfileBySlug = (slug) => {
    return Profile.findOne({ slug }).lean();
};

exports.findProfileDocumentBySlug = (slug) => {
    return Profile.findOne({ slug });
};

exports.findProfileDocumentBySlugAndTenant = (slug) => {
    return Profile.findOne({ slug });
};

exports.findProfileById = (id) => {
    return Profile.findById(id).lean();
};

exports.deleteProfileBySlug = (slug) => {
    return Profile.findOneAndDelete({ slug });
};

exports.findProfilesForStreamline = () => {
    return Profile.find({ status: 'published' }).select('name slug image').lean();
};

/**
 * Create a new profile. createdByAdmin must be set by the caller.
 */
exports.createProfile = (data) => {
    return new Profile(data).save();
};

exports.updateProfile = async (slug, updates, adminId) => {
    const profile = await Profile.findOne({ slug });
    if (!profile) throw new Error('Profile not found');

    Object.assign(profile, updates);
    profile._modifiedByAdminId = adminId;

    return profile.save();
};

exports.softDeleteProfile = async (slug) => {
    const profile = await Profile.findOne({ slug });
    if (!profile) throw new Error('Profile not found');

    return profile.softDelete();
};