const { Server } = require('socket.io');
const { User } = require('../models');
const { verifyAccessToken } = require('../utils/generateToken');

let io;

const createSocketAuthError = (message, details = {}) => {
  const error = new Error(message);
  error.data = {
    code: details.code || 'SOCKET_AUTH_ERROR',
    name: details.name || 'AuthError',
    statusCode: details.statusCode || 401,
    message,
    ...(details.expiredAt ? { expiredAt: details.expiredAt } : {})
  };
  return error;
};

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
      const rawToken = socket.handshake.auth?.token;
      const token = typeof rawToken === 'string'
        ? rawToken.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '')
        : '';

      if (!token) {
        return next(createSocketAuthError('Authentication error: Access token is required', {
          code: 'ACCESS_TOKEN_REQUIRED',
          name: 'AuthError'
        }));
      }

      if (token.split('.').length !== 3) {
        return next(createSocketAuthError('Authentication error: Invalid token format', {
          code: 'INVALID_TOKEN_FORMAT',
          name: 'JsonWebTokenError'
        }));
      }

      const tokenResult = verifyAccessToken(token);

      if (!tokenResult.valid) {
        if (tokenResult.error.name === 'TokenExpiredError') {
          return next(createSocketAuthError('Authentication error: Access token has expired', {
            code: 'TOKEN_EXPIRED',
            name: 'TokenExpiredError',
            expiredAt: tokenResult.error.expiredAt
          }));
        }

        return next(createSocketAuthError(`Authentication error: ${tokenResult.error.message}`, {
          code: 'INVALID_ACCESS_TOKEN',
          name: tokenResult.error.name || 'JsonWebTokenError'
        }));
      }
      
      // Find user
      const user = await User.findByPk(tokenResult.decoded.id, {
        attributes: ['id', 'firstName', 'lastName', 'email']
      });

      if (!user) {
        return next(createSocketAuthError('Authentication error: User not found', {
          code: 'USER_NOT_FOUND',
          name: 'AuthError'
        }));
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
      next(createSocketAuthError('Authentication error: Invalid token', {
        code: 'INVALID_ACCESS_TOKEN',
        name: error.name || 'JsonWebTokenError'
      }));
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
