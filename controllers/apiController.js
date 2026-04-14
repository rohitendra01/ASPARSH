const apiSearchService = require('../services/apiSearchService');

exports.getDesigns = async (req, res) => {
  try {
    const designs = await apiSearchService.fetchActiveDesigns();

    res.json({ success: true, data: designs });
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch designs' });
  }
};

exports.searchSkills = async (req, res) => {
  try {
    const skills = await apiSearchService.fetchSkills(req.query.q);

    res.json({ success: true, data: { skills } });
  } catch (error) {
    console.error('Skill search error:', error);
    res.status(500).json({ success: false, message: 'Failed to search skills', data: { skills: [] } });
  }
};

exports.searchProfiles = async (req, res) => {
  try {
    const profiles = await apiSearchService.fetchProfiles(req.query.q);

    res.json({ success: true, data: profiles });
  } catch (error) {
    console.error('Profile search error:', error);
    res.status(500).json({ success: false, message: 'Failed to search profiles', data: [] });
  }
};