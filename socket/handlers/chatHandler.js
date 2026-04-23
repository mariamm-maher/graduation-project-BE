const { ChatRoom, ChatParticipant, Message, User, Collaboration } = require('../../models');
const { Op } = require('sequelize');

module.exports = (io, socket) => {
  // Join collaboration chat
  socket.on('join_collaboration_chat', async (data) => {
    try {
      const { collaborationId } = data;
      const userId = socket.userId;

      // Verify user is part of the collaboration
      const collaboration = await Collaboration.findByPk(collaborationId);

      if (!collaboration) {
        return socket.emit('error', {
          event: 'join_collaboration_chat',
          message: 'Collaboration not found'
        });
      }

      // Check authorization
      const isOwner = collaboration.ownerId === userId;
      const isInfluencer = collaboration.influencerId === userId;

      if (!isOwner && !isInfluencer) {
        return socket.emit('error', {
          event: 'join_collaboration_chat',
          message: 'Unauthorized: You are not part of this collaboration'
        });
      }

      // Find or create chat room for this collaboration
      let chatRoom = await ChatRoom.findOne({
        where: { collaborationId },
        include: [
          {
            model: ChatParticipant,
            as: 'participants',
            include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
          }
        ]
      });

      if (!chatRoom) {
        const users = await User.findAll({
          where: {
            id: {
              [Op.in]: [collaboration.ownerId, collaboration.influencerId]
            }
          },
          attributes: ['id', 'firstName', 'lastName']
        });

        const owner = users.find((u) => u.id === collaboration.ownerId);
        const influencer = users.find((u) => u.id === collaboration.influencerId);
        const ownerName = `${owner?.firstName || 'Owner'} ${owner?.lastName || ''}`.trim();
        const influencerName = `${influencer?.firstName || 'Influencer'} ${influencer?.lastName || ''}`.trim();

        // Create new chat room
        chatRoom = await ChatRoom.create({
          type: 'one_to_one',
          collaborationId,
          name: `${ownerName} collab with ${influencerName}`
        });

        // Add both participants
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
              include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
            }
          ]
        });
      }

      // Join socket room
      socket.join(`chat:${chatRoom.id}`);

      // Get recent messages (last 50)
      const messages = await Message.findAll({
        where: { chatRoomId: chatRoom.id },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['sentAt', 'DESC']],
        limit: 50
      });

      const unreadCount = await Message.count({
        where: {
          chatRoomId: chatRoom.id,
          senderId: { [Op.ne]: userId },
          status: { [Op.ne]: 'read' }
        }
      });

      // Emit room_joined event
      socket.emit('room_joined', {
        chatRoom: {
          id: chatRoom.id,
          type: chatRoom.type,
          collaborationId: chatRoom.collaborationId,
          name: chatRoom.name,
          createdAt: chatRoom.createdAt
        },
        participants: chatRoom.participants.map(p => ({
          id: p.user.id,
          name: `${p.user.firstName} ${p.user.lastName}`,
          email: p.user.email,
          joinedAt: p.joinedAt,
          role: p.role
        })),
        messages: messages.reverse().map(msg => ({
          id: msg.id,
          chatRoomId: msg.chatRoomId,
          sender: {
            id: msg.sender.id,
            name: `${msg.sender.firstName} ${msg.sender.lastName}`
          },
          content: msg.content,
          status: msg.status,
          sentAt: msg.sentAt
        })),
        unreadCount
      });

      console.log(`User ${userId} joined chat room ${chatRoom.id}`);
    } catch (error) {
      console.error('Error joining collaboration chat:', error);
      socket.emit('error', {
        event: 'join_collaboration_chat',
        message: 'Failed to join chat room'
      });
    }
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { chatRoomId, content, replyToId, mediaUrl } = data;
      const userId = socket.userId;

      // Verify user is participant of this chat room
      const participant = await ChatParticipant.findOne({
        where: { chatRoomId, userId }
      });

      if (!participant) {
        return socket.emit('error', {
          event: 'send_message',
          message: 'Unauthorized: You are not a participant of this chat'
        });
      }

      // Validate message content
      if (!content && !mediaUrl) {
        return socket.emit('error', {
          event: 'send_message',
          message: 'Message content or media is required'
        });
      }

      const normalizedContent = content?.trim() || (mediaUrl ? '[Media]' : null);
      if (!normalizedContent) {
        return socket.emit('error', {
          event: 'send_message',
          message: 'Message content is required'
        });
      }

      // Create message
      const message = await Message.create({
        chatRoomId,
        senderId: userId,
        content: normalizedContent,
        status: 'sent',
        sentAt: new Date()
      });

      // Load message with sender info
      const fullMessage = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      // Format message for emission
      const messageData = {
        id: fullMessage.id,
        chatRoomId: fullMessage.chatRoomId,
        sender: {
          id: fullMessage.sender.id,
          name: `${fullMessage.sender.firstName} ${fullMessage.sender.lastName}`
        },
        content: fullMessage.content,
        status: 'delivered',
        sentAt: fullMessage.sentAt
      };

      // Update delivery status
      await message.update({ status: 'delivered' });

      // Emit to all participants in the room
      io.to(`chat:${chatRoomId}`).emit('message_received', messageData);

      // Send notification to other participants
      const otherParticipants = await ChatParticipant.findAll({
        where: {
          chatRoomId,
          userId: { [Op.ne]: userId }
        }
      });

      for (const otherParticipant of otherParticipants) {
        // Create chat notification
        const notificationService = require('../../services/notificationService');
        await notificationService.createNotification({
          userId: otherParticipant.userId,
          category: 'chat',
          type: 'new_message',
          title: `New message from ${fullMessage.sender.firstName}`,
          message: normalizedContent.substring(0, 100),
          relatedId: chatRoomId,
          actionUrl: `/chat/rooms/${chatRoomId}`
        });
      }

      console.log(`Message sent in room ${chatRoomId} by user ${userId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', {
        event: 'send_message',
        message: 'Failed to send message'
      });
    }
  });

  // Typing indicator
  socket.on('typing', async (data) => {
    try {
      const { chatRoomId } = data;
      const userId = socket.userId;

      // Verify participant
      const participant = await ChatParticipant.findOne({
        where: { chatRoomId, userId }
      });

      if (!participant) return;

      // Emit to other users in the room
      socket.to(`chat:${chatRoomId}`).emit('user_typing', {
        chatRoomId,
        user: {
          id: socket.user.id,
          name: socket.user.name
        }
      });
    } catch (error) {
      console.error('Error handling typing event:', error);
    }
  });

  // Stop typing indicator
  socket.on('stop_typing', async (data) => {
    try {
      const { chatRoomId } = data;
      const userId = socket.userId;

      // Verify participant
      const participant = await ChatParticipant.findOne({
        where: { chatRoomId, userId }
      });

      if (!participant) return;

      // Emit to other users in the room
      socket.to(`chat:${chatRoomId}`).emit('user_stopped_typing', {
        chatRoomId,
        user: {
          id: socket.user.id,
          name: socket.user.name
        }
      });
    } catch (error) {
      console.error('Error handling stop_typing event:', error);
    }
  });

  // Mark messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { chatRoomId, messageIds } = data;
      const userId = socket.userId;

      // Verify participant
      const participant = await ChatParticipant.findOne({
        where: { chatRoomId, userId }
      });

      if (!participant) {
        return socket.emit('error', {
          event: 'mark_messages_read',
          message: 'Unauthorized'
        });
      }

      if (messageIds === 'all') {
        // Mark all unread messages as read
        await Message.update(
          { status: 'read' },
          {
            where: {
              chatRoomId,
              senderId: { [Op.ne]: userId },
              status: { [Op.ne]: 'read' }
            }
          }
        );
      } else if (Array.isArray(messageIds)) {
        // Mark specific messages as read
        await Message.update(
          { status: 'read' },
          {
            where: {
              id: messageIds,
              chatRoomId,
              senderId: { [Op.ne]: userId }
            }
          }
        );
      }

      // Notify sender about read status
      io.to(`chat:${chatRoomId}`).emit('messages_read', {
        chatRoomId,
        userId,
        messageIds: messageIds === 'all' ? 'all' : messageIds
      });

      console.log(`User ${userId} marked messages as read in room ${chatRoomId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', {
        event: 'mark_messages_read',
        message: 'Failed to mark messages as read'
      });
    }
  });

  // Join room by roomId directly (used when re-connecting or switching rooms)
  socket.on('join_room', async (data) => {
    try {
      const { chatRoomId } = data;
      const userId = socket.userId;

      const participant = await ChatParticipant.findOne({
        where: { chatRoomId, userId }
      });

      if (!participant) {
        return socket.emit('error', {
          event: 'join_room',
          message: 'Unauthorized: You are not a participant of this chat'
        });
      }

      socket.join(`chat:${chatRoomId}`);
      console.log(`User ${userId} joined room ${chatRoomId} via join_room`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { event: 'join_room', message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('leave_room', async (data) => {
    try {
      const { chatRoomId } = data;
      socket.leave(`chat:${chatRoomId}`);
      console.log(`User ${socket.userId} left room ${chatRoomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });
};
