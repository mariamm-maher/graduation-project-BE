const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.use(authenticate);

router.get('/', analyticsController.getDashboard);
router.get('/campaigns', analyticsController.getCampaignsAnalytics);
router.get('/earnings', analyticsController.getEarnings);
router.get('/collaborations', analyticsController.getCollaborationsAnalytics);
router.get('/roi', analyticsController.getROI);
router.get('/performance', analyticsController.getPerformance);

module.exports = router;