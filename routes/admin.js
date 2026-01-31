const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAnalytics,
  getUsers,
  getSessions,
  getCollaborations,
  getCampaigns
} = require('../controllers/adminController');
const { getLogs, getRecentActivity } = require('../controllers/adminController');

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

// @route   GET /api/admin/analytics
// @desc    Get admin dashboard analytics
// @access  Private (ADMIN only)
router.get('/analytics', getAnalytics);

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private (ADMIN only)
router.get('/users', getUsers);

// @route   GET /api/admin/sessions
// @desc    Get all sessions
// @access  Private (ADMIN only)
router.get('/sessions', getSessions);

// @route   GET /api/admin/collaborations
// @desc    Get all collaborations
// @access  Private (ADMIN only)
router.get('/collaborations', getCollaborations);

// @route   GET /api/admin/campaigns
// @desc    Get all campaigns
// @access  Private (ADMIN only)
router.get('/campaigns', getCampaigns);

// @route   GET /api/admin/logs
// @desc    Get logs (paginated)
// @access  Private (ADMIN only)
router.get('/logs', getLogs);

// @route   GET /api/admin/logs/recent
// @desc    Get recent activity (newest 10)
// @access  Private (ADMIN only)
router.get('/logs/recent', getRecentActivity);

module.exports = router;
