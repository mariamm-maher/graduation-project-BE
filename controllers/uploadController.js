const { UploadedFile } = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { logAction } = require('../services/logServices');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');

// Multer config 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image' || file.fieldname === 'images') {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only images allowed', 400));
    }
  } else if (file.fieldname === 'document') {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError('Only PDF or DOCX allowed', 400));
    }
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});


// Middleware to ensure uploads folder exists BEFORE multer runs
const ensureUploadsFolder = (req, res, next) => {
  const uploadDir = path.join(__dirname, '../uploads');
  fs.access(uploadDir, fs.constants.F_OK)
    .then(() => next())
    .catch(async (err) => {
      if (err.code === 'ENOENT') {
        try {
          await fs.mkdir(uploadDir, { recursive: true });
          console.log('Uploads folder created automatically by middleware');
          next();
        } catch (mkdirErr) {
          return next(new AppError('Failed to create uploads directory', 500));
        }
      } else {
        return next(new AppError('Cannot access uploads directory', 500));
      }
    });
};

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private
exports.uploadSingleImage = [
  upload.single('image'),
  async (req, res, next) => {
    try {

        if (!req.file) return next(new AppError('No image file uploaded', 400));

      const fileRecord = await UploadedFile.create({
        userId: req.user.id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        type: 'image',
        url: `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`
      });

      await logAction({
        req,
        action: 'UPLOAD_SINGLE_IMAGE',
        entity: 'UploadedFile',
        entityId: fileRecord.id,
        meta: { originalName: fileRecord.originalName }
      });

      sendSuccess(res, 201, 'Image uploaded successfully', { file: fileRecord });
    } catch (error) {
      next(error);
    }
  }
];

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
exports.uploadMultipleImages = [
  upload.array('images', 10),
  async (req, res, next) => {
    try {


      if (!req.files?.length) return next(new AppError('No images uploaded', 400));

      const files = await Promise.all(req.files.map(async (file) => {
        return UploadedFile.create({
          userId: req.user.id,
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          type: 'image',
          url: `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${file.filename}`
        });
      }));

      await logAction({
        req,
        action: 'UPLOAD_MULTIPLE_IMAGES',
        entity: 'UploadedFile',
        meta: { count: files.length }
      });

      sendSuccess(res, 201, 'Images uploaded successfully', { files });
    } catch (error) {
      next(error);
    }
  }
];

// @desc    Upload document
// @route   POST /api/upload/document
// @access  Private
exports.uploadDocument = [
  upload.single('document'),
  async (req, res, next) => {
      try {


        if (!req.file) return next(new AppError('No document uploaded', 400));

      const fileRecord = await UploadedFile.create({
        userId: req.user.id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        type: 'document',
        url: `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`
      });

      await logAction({
        req,
        action: 'UPLOAD_DOCUMENT',
        entity: 'UploadedFile',
        entityId: fileRecord.id,
        meta: { originalName: fileRecord.originalName }
      });

      sendSuccess(res, 201, 'Document uploaded successfully', { file: fileRecord });
    } catch (error) {
      next(error);
    }
  }
];

// @desc    Get file metadata
// @route   GET /api/upload/:fileId
// @access  Private (owner only)
exports.getFile = async (req, res, next) => {
  try {
    const file = await UploadedFile.findOne({
      where: {
        id: req.params.fileId,
        userId: req.user.id
      }
    });

    if (!file) {
      return next(new AppError('File not found or you do not have access', 404));
    }

    sendSuccess(res, 200, 'File metadata retrieved successfully', { file });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:fileId
// @access  Private (owner only)
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await UploadedFile.findOne({
      where: {
        id: req.params.fileId,
        userId: req.user.id
      }
    });

    if (!file) {
      return next(new AppError('File not found or you do not have access', 404));
    }

    // Delete the physical file from disk (with safety check)
    try {
      await fs.access(file.path);
      await fs.unlink(file.path);
    } catch (fsErr) {
      console.log('Physical file not found or already deleted:', fsErr.message);
      // Continue anyway, since DB record is what matters
    }

    await file.destroy();

    await logAction({
      req,
      action: 'DELETE_UPLOADED_FILE',
      entity: 'UploadedFile',
      entityId: req.params.fileId,
      meta: { fileName: file.originalName }
    });

    sendSuccess(res, 200, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.ensureUploadDir = ensureUploadsFolder;