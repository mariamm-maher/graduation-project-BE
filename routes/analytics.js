const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.use(authenticate);

router.get('/', authorize('OWNER', 'INFLUENCER'), analyticsController.getDashboard);
router.get('/campaigns', authorize('OWNER', 'INFLUENCER'), analyticsController.getCampaignsAnalytics);
router.get('/earnings', authorize('INFLUENCER'), analyticsController.getEarnings);
router.get('/collaborations', authorize('OWNER', 'INFLUENCER'), analyticsController.getCollaborationsAnalytics);
router.get('/roi', authorize('OWNER'), analyticsController.getROI);
router.get('/performance', authorize('OWNER', 'INFLUENCER'), analyticsController.getPerformance);

module.exports = router;