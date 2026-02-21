const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createCampaign,
  getCampaigns,
  changeLifecycleStage
} = require('../controllers/compaginController');

// @route   GET /api/campaigns
// @desc    Get all campaigns for authenticated user
router.get('/', authenticate, authorize('OWNER'), getCampaigns);

// @route   POST /api/campaigns
// @desc    Create a new campaign
router.post('/create', authenticate, authorize('OWNER'), createCampaign);

// @route   PATCH /api/campaigns/:id/lifecycle
// @desc    Change campaign lifecycle stage
router.patch('/:id/lifecycle', authenticate, authorize('OWNER'), changeLifecycleStage);

module.exports = router;
