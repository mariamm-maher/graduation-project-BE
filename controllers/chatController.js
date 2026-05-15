const chatService = require('../services/chatService');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { emitToRoom } = require('../socket');

/**
 * Get or create chat room for collaboration
 * @route GET /api/chat/collaborations/:collaborationId/room
 */
exports.getCollaborationChatRoom = async (req, res, next) => {
  try {
    const { collaborationId } = req.params;
    const userId = req.user.id;

    const chatRoom = await chatService.getOrCreateCollaborationChat(collaborationId, userId);

    sendSuccess(res, 200, 'Chat room retrieved successfully', { chatRoom });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all chat rooms for authenticated user
 * @route GET /api/chat/rooms
 */
exports.getUserChatRooms = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const chatRooms = await chatService.getUserChatRooms(userId);

    sendSuccess(res, 200, 'Chat rooms retrieved successfully', {
      chatRooms,
      count: chatRooms.length
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get message history with pagination
 * @route GET /api/chat/rooms/:roomId/messages
 */
exports.getMessageHistory = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await chatService.getMessageHistory(roomId, userId, page, limit);

    sendSuccess(res, 200, 'Messages retrieved successfully', result);
  } catch (error) {
    return next(error);
  }
};

/**
 * Send message (REST API fallback)
 * @route POST /api/chat/rooms/:roomId/messages
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { content, mediaUrl, replyToId } = req.body;

    const message = await chatService.sendMessage(roomId, userId, {
      content,
      mediaUrl,
      replyToId
    });

    // Emit to room via Socket.io
    try {
      emitToRoom(roomId, 'message_received', {
        id: message.id,
        chatRoomId: message.chatRoomId,
        sender: {
          id: message.sender.id,
          name: `${message.sender.firstName} ${message.sender.lastName}`
        },
        content: message.content,
        status: message.status,
        sentAt: message.sentAt
      });
    } catch (socketError) {
      console.error('Socket emission failed:', socketError);
      // Continue even if socket fails
    }

    sendSuccess(res, 201, 'Message sent successfully', { message });
  } catch (error) {
    return next(error);
  }
};

/**
 * Edit message
 * @route PATCH /api/chat/messages/:id
 */
exports.editMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return next(new AppError('Message content is required', 400));
    }

    const message = await chatService.editMessage(id, userId, content);

    // Emit update to room via Socket.io
    try {
      emitToRoom(message.chatRoomId, 'message_edited', {
        messageId: message.id,
        content: message.content
      });
    } catch (socketError) {
      console.error('Socket emission failed:', socketError);
    }

    sendSuccess(res, 200, 'Message edited successfully', { message });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete message
 * @route DELETE /api/chat/messages/:id
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await chatService.deleteMessage(id, userId);

    // Emit deletion to room via Socket.io
    try {
      emitToRoom(result.chatRoomId, 'message_deleted', {
        messageId: id
      });
    } catch (socketError) {
      console.error('Socket emission failed:', socketError);
    }

    sendSuccess(res, 200, 'Message deleted successfully', null);
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark all messages in room as read
 * @route PATCH /api/chat/rooms/:roomId/read
 */
exports.markRoomAsRead = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    await chatService.markRoomAsRead(roomId, userId);

    // Emit to room via Socket.io
    try {
      emitToRoom(roomId, 'messages_read', {
        chatRoomId: roomId,
        userId
      });
    } catch (socketError) {
      console.error('Socket emission failed:', socketError);
    }

    sendSuccess(res, 200, 'Messages marked as read', null);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get total unread message count across all rooms
 * @route GET /api/chat/unread-count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ChatParticipant, Message } = require('../models');
    const { Op } = require('sequelize');

    // Get all room IDs the user is part of
    const participations = await ChatParticipant.findAll({
      where: { userId },
      attributes: ['chatRoomId']
    });

    const roomIds = participations.map(p => p.chatRoomId);

    if (roomIds.length === 0) {
      return sendSuccess(res, 200, 'Unread count retrieved', { unreadCount: 0 });
    }

    const unreadCount = await Message.count({
      where: {
        chatRoomId: { [Op.in]: roomIds },
        senderId: { [Op.ne]: userId },
        status: { [Op.ne]: 'read' }
      }
    });

    sendSuccess(res, 200, 'Unread count retrieved', { unreadCount });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get chat room details
 * @route GET /api/chat/rooms/:roomId
 */
exports.getChatRoomDetails = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const { ChatRoom, ChatParticipant, User } = require('../models');

    // Verify user is participant
    const participant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId }
    });

    if (!participant) {
      return next(new AppError('Unauthorized access to this chat room', 403));
    }

    const chatRoom = await ChatRoom.findByPk(roomId, {
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
            }
          ]
        }
      ]
    });

    if (!chatRoom) {
      return next(new AppError('Chat room not found', 404));
    }

    sendSuccess(res, 200, 'Chat room details retrieved successfully', { chatRoom });
  } catch (error) {
    return next(error);
  }
};
