const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const campaignTrackingController = require('../controllers/campaignTrackingController');

// @route   GET /api/campaigns/active/enhanced
// @desc    Get active campaigns with smart tracking analytics
// @access  Private (Owner only)
router.get('/active/enhanced', authenticate, authorize('OWNER'), campaignTrackingController.getActiveCampaignsWithTracking);

// @route   GET /api/campaigns/:id/analytics
// @desc    Get detailed analytics for a single campaign
// @access  Private (Owner only)
router.get('/:id/analytics', authenticate, authorize('OWNER'), campaignTrackingController.getCampaignAnalytics);

module.exports = router;
