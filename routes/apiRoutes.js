const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const Design = require('../models/Design');

// Get all available designs
router.get('/designs', async (req, res) => {
  try {
    const designs = await Design.find({});
    res.json(designs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/profiles/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.length < 2) return res.json([]);
    const profiles = await Profile.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
