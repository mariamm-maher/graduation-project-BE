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
          type: 'one_to_one',
          collaborationId,
          name: `Collaboration #${collaborationId}`
        });

        // Add participants
        await ChatParticipant.bulkCreate([
          {
            chatRoomId: chatRoom.id,
            userId: collaboration.ownerId,
            role: 'owner',
            joinedAt: new Date()
          },
          {
            chatRoomId: chatRoom.id,
            userId: collaboration.influencerId,
            role: 'influencer',
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
            model: Collaboration,
            as: 'collaboration',
            attributes: ['id', 'status']
          }
        ]
      });

      // Calculate unread count for each room
      const roomsWithUnread = await Promise.all(
        chatRooms.map(async (room) => {
          const otherParticipants = await ChatParticipant.findAll({
            where: {
              chatRoomId: room.id,
              userId: { [Op.ne]: userId }
            },
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email']
              }
            ]
          });

          const lastMessage = await Message.findOne({
            where: { chatRoomId: room.id },
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'firstName', 'lastName']
              }
            ],
            order: [['sentAt', 'DESC']]
          });
          
          const unreadCount = await Message.count({
            where: {
              chatRoomId: room.id,
              senderId: { [Op.ne]: userId },
              status: { [Op.ne]: 'read' }
            }
          });

          return {
            id: room.id,
            type: room.type,
            name: room.name,
            collaborationId: room.collaborationId,
            collaboration: room.collaboration,
            participants: otherParticipants
              .map(p => ({
                id: p.user.id,
                name: `${p.user.firstName} ${p.user.lastName}`,
                email: p.user.email
              })),
            lastMessage,
            unreadCount,
            updatedAt: room.createdAt || null
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
        where: { chatRoomId },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['sentAt', 'DESC']],
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

      const normalizedContent = content?.trim() || (mediaUrl ? '[Media]' : null);
      if (!normalizedContent) {
        throw new AppError('Message content is required', 400);
      }

      // Create message
      const message = await Message.create({
        chatRoomId,
        senderId: userId,
        content: normalizedContent,
        status: 'sent',
        sentAt: new Date()
      });

      // Load with relations
      const fullMessage = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

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

      await message.update({ content: newContent.trim() });

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

      const chatRoomId = message.chatRoomId;
      await message.destroy();
      return { chatRoomId };
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
          status: 'read'
        },
        {
          where: {
            chatRoomId,
            senderId: { [Op.ne]: userId },
            status: { [Op.ne]: 'read' }
          }
        }
      );

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ChatService();
