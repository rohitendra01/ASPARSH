const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const { getRequiredEnv } = require('../utils/securityConfig');

cloudinary.config({
  cloud_name: getRequiredEnv('CLOUDINARY_CLOUD_NAME'),
  api_key: getRequiredEnv('CLOUDINARY_API_KEY'),
  api_secret: getRequiredEnv('CLOUDINARY_API_SECRET')
});

const storage = multer.memoryStorage();
const MAX_FILE_SIZE_MB = 7;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error(`Only image files allowed. Received: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 25 },
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

const respondUploadError = (req, res, status, message) => {
  const accepts = (req.headers.accept || '').toLowerCase();
  const wantsJson = req.xhr || accepts.includes('application/json') || req.is('json');

  if (wantsJson) {
    return res.status(status).json({ success: false, message });
  }

  return res.status(status).send(message);
};

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return respondUploadError(req, res, 400, `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
  } else if (err) {
    return respondUploadError(req, res, 400, err.message);
  }
  next();
};

module.exports = { upload, handleUploadError, uploadToCloudinary, cloudinary };
