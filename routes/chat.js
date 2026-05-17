const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// All chat routes require authentication
router.use(authenticate);

// @route   GET /api/chat/collaborations/:collaborationId/room
// @desc    Get or create chat room for collaboration
// @access  Private (owner or influencer of collaboration)
router.get('/collaborations/:collaborationId/room', chatController.getCollaborationChatRoom);

// @route   GET /api/chat/unread-count
// @desc    Get total unread message count across all rooms
// @access  Private
router.get('/unread-count', chatController.getUnreadCount);

// @route   GET /api/chat/rooms
// @desc    Get all chat rooms for authenticated user
// @access  Private
router.get('/rooms', chatController.getUserChatRooms);

// @route   GET /api/chat/rooms/:roomId
// @desc    Get chat room details
// @access  Private (participant only)
router.get('/rooms/:roomId', chatController.getChatRoomDetails);

// @route   GET /api/chat/rooms/:roomId/messages
// @desc    Get message history with pagination
// @access  Private (participant only)
router.get('/rooms/:roomId/messages', chatController.getMessageHistory);

// @route   POST /api/chat/rooms/:roomId/messages
// @desc    Send message (REST API fallback)
// @access  Private (participant only)
router.post('/rooms/:roomId/messages', chatController.sendMessage);

// @route   PATCH /api/chat/messages/:id
// @desc    Edit message
// @access  Private (message sender only)
router.patch('/messages/:id', chatController.editMessage);

// @route   DELETE /api/chat/messages/:id
// @desc    Delete message (soft delete)
// @access  Private (message sender only)
router.delete('/messages/:id', chatController.deleteMessage);

// @route   PATCH /api/chat/rooms/:roomId/read
// @desc    Mark all messages in room as read
// @access  Private (participant only)
router.patch('/rooms/:roomId/read', chatController.markRoomAsRead);

module.exports = router;
