const { Skill } = require('../models/Portfolio');
const Profile = require('../models/Profile');
const Design = require('../models/Design');

exports.getDesigns = async (req, res) => {
  try {
    const designs = await Design.find({ isActive: true })
      .select('_id name description previewImage')
      .lean();
    
    res.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch designs' 
    });
  }
};

exports.searchSkills = async (req, res) => {
  try {
    const query = req.query.q?.trim() || '';
    
    if (query.length < 2) {
      return res.json({ skills: [] });
    }

    const skills = await Skill.find({
      name: { $regex: query, $options: 'i' }
    })
    .limit(10)
    .select('_id name iconClass description')
    .lean();

    res.json({ skills });
  } catch (error) {
    console.error('Skill search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search skills',
      skills: []
    });
  }
};

exports.searchProfiles = async (req, res) => {
  try {
    const q = req.query.q?.trim() || '';
    
    if (q.length < 2) {
      return res.json([]);
    }

    const profiles = await Profile.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } }
      ]
    })
    .limit(10)
    .select('_id name slug email mobile image')
    .lean();

    res.json(profiles);
  } catch (error) {
    console.error('Profile search error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search profiles' 
    });
  }
};
