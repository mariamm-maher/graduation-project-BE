const jwt = require('jsonwebtoken');
const { User, Session } = require('../models');
const { generateToken, generateRefreshToken, verifyAccessToken } = require('../utils/generateToken');
const AppError = require('../utils/AppError');

// Authenticate middleware - checks access token and refresh token with session management
exports.authenticate = async (req, res, next) => {
  try {
    let accessToken;

    // Get access token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      accessToken = req.headers.authorization.split(' ')[1];
      // Remove any quotes or whitespace that might have been added
      if (accessToken) {
        accessToken = accessToken.trim().replace(/^["']|["']$/g, '');
      }
    }

    if (!accessToken) {
      return next(new AppError('Access token is required', 401));
    }

    // Validate token format (should have 3 parts separated by dots)
    if (accessToken.split('.').length !== 3) {
      return next(new AppError('Invalid token format. Token must have 3 parts separated by dots.', 401));
    }

    // Verify access token using the utility function
    const result = verifyAccessToken(accessToken);

    if (!result.valid) {
      // Handle token errors
      if (result.error.name === 'TokenExpiredError') {
        return next(new AppError('Access token has expired. Please login again', 401));
      }
      
      if (result.error.name === 'JsonWebTokenError') {
        return next(new AppError(`Token verification failed: ${result.error.message}`, 401));
      }
      
      if (result.error.name === 'NotBeforeError') {
        return next(new AppError('Token not active yet', 401));
      }
      
      return next(new AppError(`Token error: ${result.error.message}`, 401));
    }

    // Find user
    const user = await User.findByPk(result.decoded.id);
    
    if (!user) {
      return next(new AppError('User not found', 401));
    }

    // Attach user to request
    req.user = user;
    req.accessToken = accessToken;
    
    return next();
  } catch (error) {
    return next(error);
  }
};


