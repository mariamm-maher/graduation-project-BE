const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');


// ── Cloudinary upload (new) ────────────────────────────────
// POST /api/upload?type=avatar|brandLogo|campaignAsset
// Field name: file (multipart/form-data)
router.post('/', uploadController.uploadToCloudinary);


module.exports = router;