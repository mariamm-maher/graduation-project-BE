const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createCampaign,
  getCampaigns
} = require('../controllers/compaginController');


// @route   GET /api/campaigns
// @desc    Get all campaigns for authenticated user
// router.get('/', authenticate, getCampaigns);
router.get('/', authenticate, getCampaigns);

// @route   POST /api/campaigns
// @desc    Create a new campaign
router.post('/create', authenticate, createCampaign);

module.exports = router;
