const multer = require('multer');
const AppError = require('../utils/AppError');

// ─────────────────────────────────────────────
// Allowed MIME types for image uploads
// ─────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
];

// ─────────────────────────────────────────────
// File filter – rejects anything that isn't an
// allowed image type and returns a 400 error.
// ─────────────────────────────────────────────
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type "${file.mimetype}". Allowed: PNG, JPEG, JPG, WEBP`,
        400
      ),
      false
    );
  }
};

// ─────────────────────────────────────────────
// Use memoryStorage so the buffer is available
// for streaming directly to Cloudinary without
// writing to disk first.
// ─────────────────────────────────────────────
const storage = multer.memoryStorage();

// ─────────────────────────────────────────────
// Main multer instance – 5 MB size limit
// ─────────────────────────────────────────────
const multerUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

module.exports = { multerUpload };
