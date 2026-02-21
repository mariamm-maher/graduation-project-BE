const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAnalytics,
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getSessions,
  getCampaigns,
  getCampaignById,
  updateCampaignStatus,
  getCollaborations,
  getCollaborationRequests,
  updateCollaborationRequestStatus,
  getCollaborationById,
  updateCollaborationStatus,
  deleteCampaign,
  getLogs,
  getRecentActivity
} = require('../controllers/adminController');

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));
//user management


// @route   GET /api/admin/analytics
// @desc    Get admin dashboard analytics
// @access  Private (ADMIN only)
router.get('/analytics', getAnalytics);

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private (ADMIN only)
router.get('/users', getUsers);

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Private (ADMIN only)
router.get('/users/:id', getUserById);

// @route   PATCH /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (ADMIN only)
router.patch('/users/:id/role', updateUserRole);

// @route   PATCH /api/admin/users/:id/status
// @desc    Update user status
// @access  Private (ADMIN only)
router.patch('/users/:id/status', updateUserStatus);


// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (ADMIN only)
router.delete('/users/:id', deleteUser);

// @route   GET /api/admin/sessions
// @desc    Get all sessions
// @access  Private (ADMIN only)
router.get('/sessions', getSessions);

//campaign management


// @route   GET /api/admin/campaigns
// // @desc    Get all campaigns
// // @access  Private (ADMIN only)
 router.get('/campaigns', getCampaigns);

// // @route   GET /api/admin/campaigns/:id
// // @desc    Get single campaign by ID
// // @access  Private (ADMIN only)
router.get('/campaigns/:id', getCampaignById);

// // @route   PATCH /api/admin/campaigns/:id/status
// // @desc    Update campaign status (lifecycleStage)
// // @access  Private (ADMIN only)
 router.patch('/campaigns/:id/status', updateCampaignStatus);

// @route   DELETE /api/admin/campaigns/:id
// @desc    Delete campaign
// @access  Private (ADMIN only)
router.delete('/campaigns/:id', deleteCampaign);


// // @route   GET /api/admin/collaborations
// // @desc    Get all collaborations
// // @access  Private (ADMIN only)
 router.get('/collaborations', getCollaborations);

// // @route   GET /api/admin/collaboration-requests
// // @desc    Get all collaboration requests
// // @access  Private (ADMIN only)
 router.get('/collaboration-requests', getCollaborationRequests);

// // @route   PATCH /api/admin/collaboration-requests/:id/status
// // @desc    Update collaboration request status
// // @access  Private (ADMIN only)
 router.patch('/collaboration-requests/:id/status', updateCollaborationRequestStatus);

// // @route   GET /api/admin/collaborations/:id
// // @desc    Get single collaboration by ID
// // @access  Private (ADMIN only)
 router.get('/collaborations/:id', getCollaborationById);

// // @route   PATCH /api/admin/collaborations/:id/status
// // @desc    Update collaboration status
// // @access  Private (ADMIN only)
 router.patch('/collaborations/:id/status', updateCollaborationStatus);

// @route   GET /api/admin/logs
// @desc    Get system logs
// @access  Private (ADMIN only)
router.get('/logs', getLogs);

// @route   GET /api/admin/recent-activity
// @desc    Get recent admin activity
// @access  Private (ADMIN only)
router.get('/recent-activity', getRecentActivity);




module.exports = router;

//==============================================================================
// // @route   GET /api/admin/chatrooms
// // @desc    Get all chat rooms
// // @access  Private (ADMIN only)
// router.get('/chatrooms', getChatRooms);

// // @route   GET /api/admin/chatrooms/:id/messages
// // @desc    Get all messages in a chat room
// // @access  Private (ADMIN only)
// router.get('/chatrooms/:id/messages', getChatRoomMessages);


