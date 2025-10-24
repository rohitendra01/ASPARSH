// middleware/uploadMiddleware.js (FINAL - Working with your installed packages)
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify Cloudinary is configured
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
  console.warn('⚠️  Warning: Cloudinary credentials not found in .env');
}

// ========== CLOUDINARY STORAGE CONFIGURATION ==========
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let resourceType = 'auto';
    let folder = 'portfolio';

    // Determine file type
    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    }

    // Create unique public_id
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const public_id = `${file.fieldname}-${timestamp}-${random}`;

    return {
      folder: folder,
      public_id: public_id,
      resource_type: resourceType,
      quality: 'auto',
      fetch_format: 'auto'
    };
  }
});

// ========== MULTER CONFIGURATION ==========
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 7 * 1024 * 1024 // 7 MB
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files allowed. Received: ${file.mimetype}`), false);
    }
  }
});

// ========== UPLOAD MIDDLEWARE FOR PORTFOLIO ==========
const uploadPortfolioImages = upload.fields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'aboutImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 }
]);

// ========== ERROR HANDLING MIDDLEWARE ==========
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size exceeds 7MB limit' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: `Upload error: ${err.message}` 
    });
  } else if (err) {
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
  next();
};

// ========== EXPORTS ==========
module.exports = {
  upload,
  uploadPortfolioImages,
  handleUploadError,
  cloudinary
};
