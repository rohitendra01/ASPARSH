const designRepository = require('../repositories/designRepository');
const portfolioRepository = require('../repositories/portfolioRepository');
const profileRepository = require('../repositories/profileRepository');

exports.fetchActiveDesigns = async () => {
    return await designRepository.findActiveDesigns();
};

exports.fetchSkills = async (queryString) => {
    const query = queryString?.trim() || '';
    if (query.length < 2) return [];

    return await portfolioRepository.searchSkillsByName(query);
};

exports.fetchProfiles = async (queryString) => {
    const query = queryString?.trim() || '';
    if (query.length < 2) return [];

    return await profileRepository.searchProfilesByKeyword(query, null);
};