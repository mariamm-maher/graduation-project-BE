const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  generateAICampaign,
  draftCampaign,
  saveAndPublish,
  createCampaign,
  saveCampaign,
  completeCampaign,
  cancelCampaign,
  getCampaigns,
  getCampaignById,
  deleteCampaign
} = require('../controllers/compaginController');

// @route   GET /api/campaigns
// @desc    Get all campaigns for authenticated user
router.get('/', authenticate, authorize('OWNER'), getCampaigns);

// @route   GET /api/campaigns/:id
// @desc    Get single campaign with all relations
router.get('/:id', authenticate, authorize('OWNER'), getCampaignById);

// @route   POST /api/campaigns/ai/generate
// @desc    Generate AI campaign preview (no DB save)
router.post('/ai/generate', authenticate, authorize('OWNER'), generateAICampaign);

// @route   POST /api/campaigns/draft
// @desc    Save AI preview or manual campaign as draft
router.post('/draft', authenticate, authorize('OWNER'), draftCampaign);

// @route   POST /api/campaigns/save-and-publish
// @desc    Save and publish campaign in one step
router.post('/save-and-publish', authenticate, authorize('OWNER'), saveAndPublish);

// @route   POST /api/campaigns/save
// @desc    Save campaign with all relations
router.post('/save', authenticate, authorize('OWNER'), saveCampaign);

// @route   POST /api/campaigns
// @desc    Create a manual campaign
router.post('/create', authenticate, authorize('OWNER'), createCampaign);

// @route   POST /api/campaigns/:id/complete
// @desc    Complete a saved campaign
router.post('/:id/complete', authenticate, authorize('OWNER'), completeCampaign);

// @route   POST /api/campaigns/:id/cancel
// @desc    Cancel a campaign
router.post('/:id/cancel', authenticate, authorize('OWNER'), cancelCampaign);

// @route   DELETE /api/campaigns/:id
// @desc    Delete a campaign
router.delete('/:id', authenticate, authorize('OWNER'), deleteCampaign);

module.exports = router;
