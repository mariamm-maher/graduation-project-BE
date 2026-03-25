const express = require('express');
const influencerOverviewController = require('../controllers/influencerOverviewController');
const influncerController = require('../controllers/influncerController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authenticate, authorize('INFLUENCER'), influencerOverviewController.getInfluencerOverview);
router.get('/overview/stats', authenticate, authorize('OWNER'), influncerController.getOverviewStats);
router.get('/campaigns/explore', authenticate, authorize('INFLUENCER'), influncerController.exploreCampaigns);
router.get('/campaigns/:id', authenticate, authorize('INFLUENCER'), influncerController.getCampaignById);
router.post('/campaigns/:id/apply', authenticate, authorize('INFLUENCER'), influncerController.applyToCampaign);

module.exports = router;
