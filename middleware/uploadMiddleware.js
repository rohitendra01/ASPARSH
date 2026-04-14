const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error(`Only image files allowed. Received: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 25 },
  fileFilter: fileFilter
});

const uploadToCloudinary = (fileBuffer, folderName, mimetype) => {
  return new Promise((resolve, reject) => {
    let resourceType = mimetype.startsWith('video/') ? 'video' : 'image';

    const public_id = `upload-${Date.now()}-${Math.round(Math.random() * 1E9)}`;

    const uploadOptions = {
      folder: `asparsh/${folderName}`,
      public_id: public_id,
      resource_type: resourceType,
      quality: 'auto',
      fetch_format: 'auto'
    };

    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { width: 1280, crop: "limit", format: "webp", quality: "auto" }
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File size exceeds 7MB limit' });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = { upload, handleUploadError, uploadToCloudinary, cloudinary };