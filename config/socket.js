const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Chat, Message } = require('../models');

// Socket.io authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
   
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

 
    socket.userId = user.id;
    socket.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    return next(new Error('Authentication error: Invalid token'));
  }
};


const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  
  io.use(authenticateSocket);

  
  const userSockets = new Map();

  io.on('connection', (socket) => {
    const userId = socket.userId;
    
    console.log(`User ${userId} connected with socket ${socket.id}`);

  
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);


    socket.join(`user:${userId}`);


    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;

        if (!chatId) {
          return socket.emit('error', { message: 'Chat ID is required' });
        }


        const chat = await Chat.findByPk(chatId);
        if (!chat) {
          return socket.emit('error', { message: 'Chat not found' });
        }

        if (chat.userId !== userId && chat.otherUserId !== userId) {
          return socket.emit('error', { message: 'Unauthorized to join this chat' });
        }


        socket.join(`chat:${chatId}`);
        socket.emit('joined_chat', { chatId });

     
        const unreadCount = await Message.count({
          where: {
            chatId,
            senderId: { [Op.ne]: userId },
            isRead: false
          }
        });

        socket.emit('unread_count', { chatId, count: unreadCount });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle leaving a chat room
    socket.on('leave_chat', (data) => {
      const { chatId } = data;
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        socket.emit('left_chat', { chatId });
      }
    });

   
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content } = data;

        if (!chatId || !content || content.trim().length === 0) {
          return socket.emit('error', { message: 'Chat ID and message content are required' });
        }

      
        const chat = await Chat.findByPk(chatId);
        if (!chat) {
          return socket.emit('error', { message: 'Chat not found' });
        }

        if (chat.userId !== userId && chat.otherUserId !== userId) {
          return socket.emit('error', { message: 'Unauthorized to send messages in this chat' });
        }

      
        const message = await Message.create({
          chatId,
          senderId: userId,
          content: content.trim()
        });

    
        await chat.update({
          lastMessageAt: new Date()
        });

       
        const messageWithSender = await Message.findByPk(message.id, {
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        });

        
        const recipientId = chat.userId === userId ? chat.otherUserId : chat.userId;

        // Emit to all users in the chat room (including sender for confirmation)
        io.to(`chat:${chatId}`).emit('new_message', {
          message: messageWithSender,
          chatId
        });

        // Also emit to recipient's personal room if they're not in the chat room
        io.to(`user:${recipientId}`).emit('new_message_notification', {
          message: messageWithSender,
          chatId
        });

    
        socket.emit('message_sent', {
          message: messageWithSender,
          chatId
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: error.message || 'Failed to send message' });
      }
    });

   
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      if (chatId) {
        // Broadcast typing status to other users in the chat
        socket.to(`chat:${chatId}`).emit('user_typing', {
          userId,
          chatId,
          isTyping,
          userName: `${socket.user.firstName} ${socket.user.lastName}`
        });
      }
    });

  
    // socket.on('mark_read', async (data) => {
    //   try {
    //     const { chatId } = data;

    //     if (!chatId) {
    //       return socket.emit('error', { message: 'Chat ID is required' });
    //     }

    //     // Verify user is part of the chat
    //     const chat = await Chat.findByPk(chatId);
    //     if (!chat) {
    //       return socket.emit('error', { message: 'Chat not found' });
    //     }

    //     if (chat.userId !== userId && chat.influencerId !== userId) {
    //       return socket.emit('error', { message: 'Unauthorized' });
    //     }

        
    //     await Message.update(
    //       {
    //         isRead: true,
    //         readAt: new Date()
    //       },
    //       {
    //         where: {
    //           chatId,
    //           senderId: { [Op.ne]: userId },
    //           isRead: false
    //         }
    //       }
    //      );

    //     // Notify other users in the chat
    //     socket.to(`chat:${chatId}`).emit('messages_read', {
    //       chatId,
    //       readBy: userId
    //     });
    //   } catch (error) {
    //     socket.emit('error', { message: error.message });
    //   }
    // });

  
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected (socket ${socket.id})`);
      
      // Remove socket from user's connections
      if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io;
};

module.exports = initializeSocket;
