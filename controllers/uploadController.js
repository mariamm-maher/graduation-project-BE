
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { logAction } = require('../services/logServices');

// ─────────────────────────────────────────────────────────
// Cloudinary Upload
// @desc    Upload image to Cloudinary and return hosted URL
// @route   POST /api/upload
// @access  Private
// ─────────────────────────────────────────────────────────
const { uploadSingle } = require('../uploads/upload.middleware');
const { uploadImage, resolveFolder } = require('../uploads/upload.service');

/**
 * POST /api/upload?type=avatar|brandLogo|campaignAsset
 *
 * Accepts multipart/form-data with field name "file".
 * The optional `type` query param controls the Cloudinary folder:
 *   avatar        → avatars/
 *   brandLogo     → brand-logos/
 *   campaignAsset → campaign-assets/
 *   (none)        → general/
 */
exports.uploadToCloudinary = [
  // Multer middleware — parses the multipart body into req.file
  uploadSingle('file'),
  async (req, res, next) => {
    try {
      // Guard: multer already validates type & size, but double-check presence
      if (!req.file) {
        return next(new AppError('No file uploaded. Send a file under the field name "file".', 400));
      }

      // Resolve Cloudinary folder from ?type query param
      const folder = resolveFolder(req.query.type);

      // Stream buffer → Cloudinary
      const { url, publicId } = await uploadImage(
        req.file.buffer,
        req.file.mimetype,
        folder
      );

      // Fire-and-forget audit log
      try {
        await logAction({
          req,
          action: 'UPLOAD_TO_CLOUDINARY',
          meta: { originalName: req.file.originalname, folder, url }
        });
      } catch (_) { /* non-blocking */ }

      sendSuccess(res, 201, 'Image uploaded successfully', {
        success:  true,
        url,
        publicId
      });
    } catch (error) {
      next(error);
    }
  }
];