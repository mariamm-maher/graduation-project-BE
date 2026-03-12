const { multerUpload } = require('./upload.config');
const AppError = require('../utils/AppError');

// ─────────────────────────────────────────────
// Wraps multer errors into the shared AppError
// format so the global error handler renders
// consistent JSON (status + message).
// ─────────────────────────────────────────────
const wrapMulterError = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    // Multer-specific codes
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File is too large. Maximum allowed size is 5 MB.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError(`Unexpected field. Use the correct field name.`, 400));
    }

    // Errors thrown inside fileFilter (AppError instances)
    if (err.status === 400 || err.statusCode === 400) {
      return next(err);
    }

    // Fallback for any other multer error
    return next(new AppError(`File upload error: ${err.message}`, 400));
  });
};

// ─────────────────────────────────────────────
// uploadSingle(fieldName)
//   Accepts exactly one file under <fieldName>.
//   Usage: router.post('/avatar', uploadSingle('file'), handler)
// ─────────────────────────────────────────────
const uploadSingle = (fieldName = 'file') =>
  wrapMulterError(multerUpload.single(fieldName));

// ─────────────────────────────────────────────
// uploadMultiple(fieldName, maxCount)
//   Accepts up to <maxCount> files under <fieldName>.
//   Usage: router.post('/gallery', uploadMultiple('files', 5), handler)
// ─────────────────────────────────────────────
const uploadMultiple = (fieldName = 'files', maxCount = 10) =>
  wrapMulterError(multerUpload.array(fieldName, maxCount));

module.exports = { uploadSingle, uploadMultiple };
