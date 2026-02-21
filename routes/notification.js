const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth'); // No authorize, as it's for any authenticated user
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticate);

// @route   GET /api/notifications
// @desc    Get all user notifications (paginated)
// @access  Private (authenticated user)
router.get('/', getNotifications);

// @route   GET /api/notifications/unread
// @desc    Get unread notifications count
// @access  Private (authenticated user)
router.get('/unread', getUnreadCount);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private (authenticated user)
router.patch('/:id/read', markAsRead);

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private (authenticated user)
router.patch('/read-all', markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private (authenticated user)
router.delete('/:id', deleteNotification);

module.exports = router;