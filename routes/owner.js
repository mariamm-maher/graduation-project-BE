const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const brandDashboardController = require('../controllers/brandDashboardController');
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

router.get('/interest-messages', authenticate, authorize('OWNER'), ownerController.getInterestMessages);
router.patch('/interest-messages/:id/read', authenticate, authorize('OWNER'), ownerController.markInterestMessageRead);

/**
 * @route   GET /api/owner/brand-dashboard
 * @desc    Get brand dashboard data
 * @access  Private (Owner only)
 */
router.get('/brand-dashboard', authenticate, authorize('OWNER'), brandDashboardController.getDashboard);

/**
 * @route   GET /api/owner/ai-insights
 * @desc    Get AI-powered insights
 * @access  Private (Owner only)
 */
router.get('/ai-insights', authenticate, authorize('OWNER'), brandDashboardController.getAIInsights);

/**
 * @route   GET /api/owner/performance-trend
 * @desc    Get performance trend data
 * @access  Private (Owner only)
 */
router.get('/performance-trend', authenticate, authorize('OWNER'), brandDashboardController.getPerformanceTrend);

/**
 * @route   GET /api/owner/platform-analytics
 * @desc    Get platform analytics data
 * @access  Private (Owner only)
 */
router.get('/platform-analytics', authenticate, authorize('OWNER'), brandDashboardController.getPlatformAnalytics);

module.exports = router;
