const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/owner/influencers
 * @desc    Get all influencer profiles (with filters)
 * @access  Private (Owner only)
 */
router.get('/influencers', authenticate, authorize('OWNER'), ownerController.getAllInfluencers);

/**
 * @route   GET /api/owner/influencers/:id
 * @desc    Get single influencer profile by ID
 * @access  Private (Owner only)
 */
router.get('/influencers/:id', authenticate, authorize('OWNER'), ownerController.getInfluencerById);

module.exports = router;
