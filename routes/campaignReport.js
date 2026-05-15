const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const campaignReportController = require('../controllers/campaignReportController');

// @route   GET /api/campaigns/:id/report
// @desc    Generate PDF report for a single completed campaign
// @access  Private (Owner only)
router.get('/:id/report', authenticate, authorize('OWNER'), campaignReportController.generateCampaignReport);

// @route   GET /api/campaigns/reports/completed
// @desc    Generate bulk PDF report for all completed campaigns
// @access  Private (Owner only)
router.get('/reports/completed', authenticate, authorize('OWNER'), campaignReportController.generateBulkReport);

module.exports = router;
