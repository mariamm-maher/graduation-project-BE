const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const ownerOverviewRoutes = require('./ownerOverviewRoutes');
const { authenticate, authorize } = require('../middleware/auth');

router.use('/', ownerOverviewRoutes);

/**
 * @route   GET /api/owner/influencers
 * @desc    Get all influencer profiles (with filters)
 * @access  Private (Owner only)
 */
router.get('/influencers', authenticate, authorize('OWNER'), ownerController.getAllInfluencers);

/**
 * @route   GET /api/owner/influencers/active
 * @desc    Get active influencers (collaborations in progress or live)
 * @access  Private (Owner only)
 */
router.get('/influencers/active', authenticate, authorize('OWNER'), ownerController.getActiveInfluencers);

/**
 * @route   GET /api/owner/influencers/past
 * @desc    Get past influencers (collaborations completed)
 * @access  Private (Owner only)
 */
router.get('/influencers/past', authenticate, authorize('OWNER'), ownerController.getPastInfluencers);

/**
 * @route   GET /api/owner/influencers/:id
 * @desc    Get single influencer profile by ID
 * @access  Private (Owner only)
 */
router.get('/influencers/:id', authenticate, authorize('OWNER'), ownerController.getInfluencerById);

module.exports = router;
