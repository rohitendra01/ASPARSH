const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/:slug', isLoggedIn, userController.viewUserProfile);
router.get('/edit/:slug', isLoggedIn, userController.renderEditUserProfile);
router.post('/edit/:slug', isLoggedIn, upload.single('image'), userController.updateUserProfile);
module.exports = router;
