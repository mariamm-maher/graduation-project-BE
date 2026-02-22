const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

router.use(uploadController.ensureUploadDir);

// All routes require authentication
router.use(authenticate);

router.post('/image', uploadController.uploadSingleImage);
router.post('/images', uploadController.uploadMultipleImages);
router.post('/document', uploadController.uploadDocument);
router.get('/:fileId', uploadController.getFile);
router.delete('/:fileId', uploadController.deleteFile);

module.exports = router;