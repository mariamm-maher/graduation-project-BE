const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

let io;

// Initialize Socket.io server
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'firstName', 'lastName', 'email']
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.userId = user.id;
      socket.user = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      };

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (ID: ${socket.userId})`);

    // Join user's personal notification room
    socket.join(`user:${socket.userId}`);

    // Load chat handlers
    require('./handlers/chatHandler')(io, socket);

    // Load notification handlers
    require('./handlers/notificationHandler')(io, socket);

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name} (ID: ${socket.userId})`);
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  console.log('🔌 Socket.io server initialized');
  return io;
};

// Get Socket.io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

// Emit to user's personal room
const emitToUser = (userId, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
};

// Emit to chat room
const emitToRoom = (roomId, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }
  io.to(`chat:${roomId}`).emit(event, data);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRoom
};
