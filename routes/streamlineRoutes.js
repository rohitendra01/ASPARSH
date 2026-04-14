const express = require('express');
const router = express.Router();
const streamlineController = require('../controllers/streamlineController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware'); // <-- IMPORT UPLOAD

const streamlineUploads = upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'aboutImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
]);

router.get('/dashboard', isLoggedIn, streamlineController.renderDashboard);

router.post('/quick-create', isLoggedIn, streamlineUploads, streamlineController.quickCreate);

module.exports = router;