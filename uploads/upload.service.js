const cloudinary = require('cloudinary').v2;
const AppError = require('../utils/AppError');

// ─────────────────────────────────────────────
// Configure Cloudinary from environment variables.
// Required in .env:
//   CLOUDINARY_CLOUD_NAME=...
//   CLOUDINARY_API_KEY=...
//   CLOUDINARY_API_SECRET=...
// ─────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true
});

// ─────────────────────────────────────────────
// Allowed upload-type → Cloudinary folder map.
// Add new types here without touching routes.
// ─────────────────────────────────────────────
const FOLDER_MAP = {
  avatar:        'avatars',
  brandLogo:     'brand-logos',
  campaignAsset: 'campaign-assets'
};

const DEFAULT_FOLDER = 'general';

/**
 * Resolve a friendly type string to a Cloudinary folder path.
 * @param {string|undefined} type  - e.g. "avatar", "brandLogo", "campaignAsset"
 * @returns {string} Cloudinary folder name
 */
const resolveFolder = (type) => FOLDER_MAP[type] || DEFAULT_FOLDER;

/**
 * Upload a single file buffer to Cloudinary.
 *
 * @param {Buffer}  fileBuffer  - req.file.buffer from memoryStorage
 * @param {string}  mimeType    - req.file.mimetype, e.g. "image/jpeg"
 * @param {string}  [folder]    - Cloudinary folder name (use resolveFolder)
 * @param {object}  [options]   - Extra Cloudinary upload options
 *
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadImage = (fileBuffer, mimeType, folder = DEFAULT_FOLDER, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Auto-optimize format & quality for web delivery
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        ...options
      },
      (error, result) => {
        if (error) {
          return reject(
            new AppError(`Cloudinary upload failed: ${error.message}`, 500)
          );
        }
        resolve({
          url:      result.secure_url,
          publicId: result.public_id
        });
      }
    );

    // Write the in-memory buffer to the upload stream
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an image from Cloudinary by its public_id.
 *
 * @param {string} publicId - The Cloudinary public_id to remove
 * @returns {Promise<object>} Cloudinary deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'
    });
    return result;
  } catch (error) {
    throw new AppError(`Failed to delete image: ${error.message}`, 500);
  }
};

module.exports = { uploadImage, deleteImage, resolveFolder, FOLDER_MAP };
