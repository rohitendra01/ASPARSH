const profileRepository = require('../repositories/profileRepository');
const designRepository = require('../repositories/designRepository');
const qrRepository = require('../repositories/qrRepository');
const portfolioService = require('./portfolioService');

exports.getStreamlineDashboardData = async () => {
    const [profiles, designs, unassignedQrs] = await Promise.all([
        profileRepository.findProfilesForStreamline(),
        designRepository.findActiveDesigns(),
        qrRepository.findUnassignedQRs()
    ]);

    return { profiles, designs, unassignedQrs };
};

exports.processQuickCreate = async (payload, files, userId) => {
    if (!payload.profileId || !payload.designId) {
        throw new Error('Profile and Design are required');
    }

    return await portfolioService.processPortfolioCreation(payload, files, userId);
};