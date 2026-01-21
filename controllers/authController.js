const passport = require('passport');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');

// Signup function
exports.signup = (req, res, next) => {
  passport.authenticate('local-signup', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new AppError('Signup failed', 400));
    }

    // Send success response
    sendSuccess(res, 201, 'User registered successfully', {
      userId: user.id,
      needsRoleSelection: true
    });
  })(req, res, next);
};

// Select role function
exports.selectRole = async (req, res, next) => {
  try {
    const { userId, roleId } = req.body;

    // Validate required fields
    if (!userId || !roleId) {
      return next(new AppError('UserId and roleId are required', 400));
    }

    const { User, Role, UserRole } = require('../models');

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return next(new AppError('Role not found', 404));
    }

    // Check if user already has this role
    const existingUserRole = await UserRole.findOne({
      where: { userId, roleId }
    });

    if (existingUserRole) {
      return next(new AppError('User already has this role', 400));
    }

    // Assign role to user
    await UserRole.create({ userId, roleId });

    sendSuccess(res, 201, 'Role assigned successfully', {
      userId,
      roleId,
      roleName: role.name
    });
  } catch (error) {
    next(error);
  }
};

// Login function
exports.login = async (req, res, next) => {
  passport.authenticate('local-login', async (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new AppError('Login failed', 401));
    }

    try {
      // Generate JWT tokens
      const { generateToken, generateRefreshToken } = require('../utils/generateToken');
      const accessToken = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token to database
      const { User } = require('../models');
      await User.update(
        { refreshToken },
        { where: { id: user.id } }
      );

      sendSuccess(res, 200, 'Login successful', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accessToken,
        refreshToken
      });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
};

// Refresh access token function
exports.refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    const jwt = require('jsonwebtoken');
    const { User } = require('../models');
    const { generateToken } = require('../utils/generateToken');

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key'
    );

    // Find user and check if refresh token matches
    const user = await User.findOne({
      where: {
        id: decoded.id,
        refreshToken
      }
    });

    if (!user) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new access token
    const accessToken = generateToken(user.id);

    sendSuccess(res, 200, 'Token refreshed successfully', {
      accessToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired refresh token', 401));
    }
    next(error);
  }
};