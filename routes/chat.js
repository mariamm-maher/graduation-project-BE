const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  startChat,
  sendMessage,
  getChats,
  getMessages,
  getChatByUserName
} = require('../controllers/chatController');

// All routes require authentication
router.use(protect);

// Start or get a chat conversation
router.post('/start', startChat);

// Get all chats for the current user
router.get('/', getChats);

// Get a chat by user name
router.get('/user/:userName', getChatByUserName);

// Get messages for a specific chat
router.get('/:chatId/messages', getMessages);

// Send a message in a chat
router.post('/:chatId/messages', sendMessage);

module.exports = router;

