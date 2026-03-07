const { ChatRoom, ChatParticipant, Message, User, Collaboration } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

class ChatService {
  /**
   * Get or create chat room for collaboration
   */
  async getOrCreateCollaborationChat(collaborationId, userId) {
    try {
      // Verify collaboration exists and user is authorized
      const collaboration = await Collaboration.findByPk(collaborationId);

      if (!collaboration) {
        throw new AppError('Collaboration not found', 404);
      }

      const isAuthorized =
        collaboration.ownerId === userId || collaboration.influencerId === userId;

      if (!isAuthorized) {
        throw new AppError('Unauthorized access to this collaboration', 403);
      }

      // Find existing chat room
      let chatRoom = await ChatRoom.findOne({
        where: { collaborationId },
        include: [
          {
            model: ChatParticipant,
            as: 'participants',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email']
              }
            ]
          }
        ]
      });

      // Create if doesn't exist
      if (!chatRoom) {
        chatRoom = await ChatRoom.create({
          type: 'direct',
          collaborationId,
          metadata: {
            campaignName: 'Collaboration Chat'
          }
        });

        // Add participants
        await ChatParticipant.bulkCreate([
          {
            chatRoomId: chatRoom.id,
            userId: collaboration.ownerId,
            joinedAt: new Date()
          },
          {
            chatRoomId: chatRoom.id,
            userId: collaboration.influencerId,
            joinedAt: new Date()
          }
        ]);

        // Reload with participants
        chatRoom = await ChatRoom.findByPk(chatRoom.id, {
          include: [
            {
              model: ChatParticipant,
              as: 'participants',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'firstName', 'lastName', 'email']
                }
              ]
            }
          ]
        });
      }

      return chatRoom;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all chat rooms for user
   */
  async getUserChatRooms(userId) {
    try {
      const chatRooms = await ChatRoom.findAll({
        include: [
          {
            model: ChatParticipant,
            as: 'participants',
            where: { userId },
            required: true
          },
          {
            model: ChatParticipant,
            as: 'participants',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email']
              }
            ]
          },
          {
            model: Message,
            as: 'messages',
            limit: 1,
            order: [['createdAt', 'DESC']],
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'firstName', 'lastName']
              }
            ]
          },
          {
            model: Collaboration,
            as: 'collaboration',
            attributes: ['id', 'status']
          }
        ],
        order: [['updatedAt', 'DESC']]
      });

      // Calculate unread count for each room
      const roomsWithUnread = await Promise.all(
        chatRooms.map(async (room) => {
          const participant = room.participants.find(p => p.userId === userId);
          
          const unreadCount = await Message.count({
            where: {
              chatRoomId: room.id,
              senderId: { [Op.ne]: userId },
              createdAt: { [Op.gt]: participant.lastReadAt || new Date(0) },
              deletedAt: null
            }
          });

          return {
            id: room.id,
            type: room.type,
            name: room.name,
            collaborationId: room.collaborationId,
            collaboration: room.collaboration,
            participants: room.participants
              .filter(p => p.userId !== userId)
              .map(p => ({
                id: p.user.id,
                name: `${p.user.firstName} ${p.user.lastName}`,
                email: p.user.email
              })),
            lastMessage: room.messages[0] || null,
            unreadCount,
            updatedAt: room.updatedAt
          };
        })
      );

      return roomsWithUnread;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get message history with pagination
   */
  async getMessageHistory(chatRoomId, userId, page = 1, limit = 50) {
    try {
      // Verify user is participant
      const participant = await ChatParticipant.findOne({
        where: { chatRoomId, userId }
      });

      if (!participant) {
        throw new AppError('Unauthorized access to this chat room', 403);
      }

      const offset = (page - 1) * limit;

      const { count, rows: messages } = await Message.findAndCountAll({
        where: {
          chatRoomId,
          deletedAt: null
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Message,
            as: 'replyTo',
            attributes: ['id', 'content', 'senderId'],
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'firstName', 'lastName']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        messages: messages.reverse(),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalMessages: count,
          hasMore: offset + messages.length < count
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send message (REST API fallback)
   */
  async sendMessage(chatRoomId, userId, { content, mediaUrl, replyToId }) {
    try {
      // Verify user is participant
      const participant = await ChatParticipant.findOne({
        where: { chatRoomId, userId }
      });

      if (!participant) {
        throw new AppError('Unauthorized access to this chat room', 403);
      }

      // Validate content
      if (!content && !mediaUrl) {
        throw new AppError('Message content or media is required', 400);
      }

      // Create message
      const message = await Message.create({
        chatRoomId,
        senderId: userId,
        content: content?.trim() || null,
        mediaUrl: mediaUrl || null,
        replyToId: replyToId || null,
        deliveryStatus: 'sent'
      });

      // Load with relations
      const fullMessage = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Message,
            as: 'replyTo',
            attributes: ['id', 'content', 'senderId'],
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'firstName', 'lastName']
              }
            ]
          }
        ]
      });

      // Update chat room timestamp
      await ChatRoom.update(
        { updatedAt: new Date() },
        { where: { id: chatRoomId } }
      );

      return fullMessage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Edit message
   */
  async editMessage(messageId, userId, newContent) {
    try {
      const message = await Message.findByPk(messageId);

      if (!message) {
        throw new AppError('Message not found', 404);
      }

      if (message.senderId !== userId) {
        throw new AppError('Unauthorized: You can only edit your own messages', 403);
      }

      if (message.deletedAt) {
        throw new AppError('Cannot edit deleted message', 400);
      }

      await message.update({
        content: newContent.trim(),
        editedAt: new Date()
      });

      return message;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId, userId) {
    try {
      const message = await Message.findByPk(messageId);

      if (!message) {
        throw new AppError('Message not found', 404);
      }

      if (message.senderId !== userId) {
        throw new AppError('Unauthorized: You can only delete your own messages', 403);
      }

      if (message.deletedAt) {
        throw new AppError('Message already deleted', 400);
      }

      await message.update({
        deletedAt: new Date(),
        content: '[Message deleted]'
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark all messages in room as read
   */
  async markRoomAsRead(chatRoomId, userId) {
    try {
      // Verify participant
      const participant = await ChatParticipant.findOne({
        where: { chatRoomId, userId }
      });

      if (!participant) {
        throw new AppError('Unauthorized', 403);
      }

      // Update messages
      await Message.update(
        {
          isRead: true,
          deliveryStatus: 'read'
        },
        {
          where: {
            chatRoomId,
            senderId: { [Op.ne]: userId },
            isRead: false
          }
        }
      );

      // Update participant last read time
      await participant.update({ lastReadAt: new Date() });

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ChatService();
