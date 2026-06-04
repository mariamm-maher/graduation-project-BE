const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  generateAICampaign,
  saveAndPublish,
  createCampaign,
  saveCampaign,
  completeCampaign,
  cancelCampaign,
  getCampaigns,
  getCampaignById,
  getCampaignsOverview,
  getCampaignAnalytics,
  getActiveCampaigns,
  deleteCampaign,
  
} = require('../controllers/campaginController');
const {
  createDraft,
  updateDraft,
  getDraft
} = require('../controllers/draftController');

// @route   GET /api/campaigns
// @desc    Get all campaigns for authenticated user
router.get('/', authenticate, authorize('OWNER'), getCampaigns);

// @route   GET /api/campaigns/active
// @desc    Get active campaigns
router.get('/active', authenticate, authorize('OWNER'), getActiveCampaigns);

// @route   GET /api/campaigns/overview
// @desc    Get campaigns overview (totals and recent campaigns)
router.get('/overview', authenticate, authorize('OWNER'), getCampaignsOverview);

// @route   GET /api/campaigns/analytics
// @desc    Get owner campaigns analytics insights
router.get('/analytics', authenticate, authorize('OWNER'), getCampaignAnalytics);

// @route   GET /api/campaigns/draft/:draft_id
// @desc    Load a generation-workflow draft
router.get('/draft/:draft_id', authenticate, authorize('OWNER'), getDraft);

// @route   GET /api/campaigns/:id
// @desc    Get single campaign with all relations
router.get('/:id', authenticate, authorize('OWNER'), getCampaignById);

// @route   POST /api/campaigns/ai/generate
// @desc    Generate AI campaign preview (no DB save)
router.post('/ai/generate', authenticate, authorize('OWNER'), generateAICampaign);

// @route   POST /api/campaigns/draft
// @desc    Save a new generation-workflow draft
router.post('/draft', authenticate, authorize('OWNER'), createDraft);

// @route   PUT /api/campaigns/draft/:draft_id
// @desc    Update an existing generation-workflow draft
router.put('/draft/:draft_id', authenticate, authorize('OWNER'), updateDraft);

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
