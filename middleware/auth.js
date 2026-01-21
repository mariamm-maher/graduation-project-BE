const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { generateToken } = require('../utils/generateToken');
const AppError = require('../utils/AppError');

// Authenticate middleware - checks access token and refresh token
exports.authenticate = async (req, res, next) => {
  try {
    let accessToken;
    let refreshToken;

    // Get access token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      accessToken = req.headers.authorization.split(' ')[1];
    }

    // Get refresh token from header or body
    refreshToken = req.headers['x-refresh-token'] || req.body.refreshToken;

    if (!accessToken) {
      return next(new AppError('Access token is required', 401));
    }

    try {
      // Try to verify access token
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'your-secret-key');
      
      // Find user
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return next(new AppError('User not found', 401));
      }

      // Attach user to request
      req.user = user;
      req.accessToken = accessToken;
      
      return next();
    } catch (error) {
      // If access token is expired, try to refresh it
      if (error.name === 'TokenExpiredError') {
        if (!refreshToken) {
          return next(new AppError('Access token expired. Refresh token required', 401));
        }

        try {
          // Verify refresh token
          const refreshDecoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key'
          );

          // Find user and verify refresh token matches database
          const user = await User.findOne({
            where: {
              id: refreshDecoded.id,
              refreshToken
            }
          });

          if (!user) {
            return next(new AppError('Invalid refresh token', 401));
          }

          // Generate new access token
          const newAccessToken = generateToken(user.id);

          // Attach user and new token to request
          req.user = user;
          req.accessToken = newAccessToken;
          req.newAccessToken = newAccessToken; // Signal that a new token was generated

          // Send new access token in response header
          res.setHeader('X-New-Access-Token', newAccessToken);

          return next();
        } catch (refreshError) {
          if (refreshError.name === 'TokenExpiredError') {
            return next(new AppError('Refresh token expired. Please login again', 401));
          }
          return next(new AppError('Invalid refresh token', 401));
        }
      }

      // Other JWT errors (invalid signature, malformed token, etc.)
      return next(new AppError('Invalid access token', 401));
    }
  } catch (error) {
    return next(error);
  }
};

// Legacy protect middleware for backward compatibility
exports.protect = exports.authenticate;
