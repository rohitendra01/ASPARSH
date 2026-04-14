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

// kept for backward-compat; now delegates to findAllProfiles (tenantId ignored)
exports.findProfilesByTenant = (tenantId, searchQuery = null, limit = null) => {
    return exports.findAllProfiles(searchQuery, limit);
};

/**
 * Keyword search scoped to a tenant — used by the AJAX profile picker.
 */
exports.searchProfilesByKeyword = (keyword, tenantId, limit = 8) => {
    const regex = { $regex: keyword.trim(), $options: 'i' };
    // tenantId param kept for API compat but no longer used to filter
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

exports.deleteProfileBySlug = (slug) => {
    return Profile.findOneAndDelete({ slug });
};

exports.findProfilesForStreamline = () => {
    return Profile.find({ status: 'published' }).select('name slug image').lean();
};

// tenantId param kept for API compat but ownership is no longer checked
exports.findProfileDocumentBySlugAndTenant = (slug, tenantId) => {
    return Profile.findOne({ slug });
};

exports.createProfile = (data) => {
    if (data.createdBy && !data.tenantId) {
        data.tenantId = data.createdBy;
    }
    return new Profile(data).save();
};

exports.updateProfile = async (slug, tenantId, updates, adminId) => {
    // tenantId ownership check removed — all admins can edit any profile
    const profile = await Profile.findOne({ slug });
    if (!profile) throw new Error('Profile not found');

    Object.assign(profile, updates);
    profile._modifiedByAdminId = adminId;

    return profile.save();
};

exports.softDeleteProfile = async (slug, tenantId) => {
    // tenantId ownership check removed — all admins can delete any profile
    const profile = await Profile.findOne({ slug });
    if (!profile) throw new Error('Profile not found');

    return profile.softDelete();
};