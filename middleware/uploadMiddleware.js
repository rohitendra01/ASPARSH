// middleware/uploadMiddleware.js (FINAL - Works with native Cloudinary SDK)
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
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

// ========== MEMORY STORAGE ==========
const storage = multer.memoryStorage();

// ========== FILE FILTER ==========
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Only image files allowed. Received: ${file.mimetype}`), false);
  }
};

// ========== MULTER CONFIGURATION ==========
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 7 * 1024 * 1024 // 7 MB
  },
  fileFilter: fileFilter
});

// ========== UPLOAD MIDDLEWARE FOR PORTFOLIO ==========
const uploadPortfolioImages = upload.fields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'aboutImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 }
]);

// ========== FUNCTION TO UPLOAD BUFFER TO CLOUDINARY ==========
// This replaces what CloudinaryStorage was doing automatically
const uploadToCloudinary = (fileBuffer, fieldName, mimetype) => {
  return new Promise((resolve, reject) => {
    // Determine resource type
    let resourceType = 'auto';
    if (mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (mimetype.startsWith('video/')) {
      resourceType = 'video';
    }

    // Create unique public_id
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const public_id = `${fieldName}-${timestamp}-${random}`;

    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'portfolio',
        public_id: public_id,
        resource_type: resourceType,
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Pipe file buffer to upload stream
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

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
  uploadToCloudinary,
  cloudinary
};
