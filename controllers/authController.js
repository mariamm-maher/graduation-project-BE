const passport = require('passport');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const { Session, UserRole } = require('../models');
const e = require('express');
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
      roleName: role.name,
      needsOnBoarding: true
    });
  } catch (error) {
    next(error);
  }
};

// Login function

exports.login = async (req, res, next) => {
  passport.authenticate('local-login', async (err, user, info) => {
    if (err) return next(err);
    if (!user) return next(new AppError('Login failed', 401));

    try {
      // 1 Generate access + refresh tokens
      const accessToken = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // 2️ Hash refresh token before saving
      const refreshTokenHash = Session.hashToken(refreshToken);

      // 3️ Create new session in DB
      const session = await Session.create({
        userId: user.id,
        refreshTokenHash,
        device: req.headers['user-agent'] || null,
        ip: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
       
      });

      // 4️ Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      // 5️ Check if user has role assigned
      const userRole = await UserRole.findOne({ where: { userId: user.id } });

      if (!userRole) {
        return sendSuccess(res, 200, 'Login successful, role selection required', {
          userId: user.id,
          email: user.email,
          needsRoleSelection: true,
          accessToken
        });
      }

      // 6️ Return success for user with role
      sendSuccess(res, 200, 'Login successful', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accessToken,
        needsRoleSelection: false
      });

    } catch (error) {
      return next(error);
    }
  })(req, res, next);
};

// Refresh access token function
exports.refreshAccessToken = async (req, res, next) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 401));
    }

    // Verify refresh token JWT
    const result = verifyRefreshToken(refreshToken);

    if (!result.valid) {
      // Handle token errors
      if (result.error.name === 'TokenExpiredError') {
        return next(new AppError('Session has expired. Please login again', 401));
      }
      return next(new AppError(`Invalid refresh token: ${result.error.message}`, 401));
    }

    // Hash the refresh token to look it up in the Session table
    const refreshTokenHash = Session.hashToken(refreshToken);

    // Find the session with this refresh token hash
    const { User } = require('../models');
    const session = await Session.findOne({
      where: {
        userId: result.decoded.id,
        refreshTokenHash
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!session) {
      return next(new AppError('Session not found. Please login again', 401));
    }

    // Check if session is expired
    if (session.isExpired()) {
      return next(new AppError('Session has expired. Please login again', 401));
    }

    // Check if session is revoked
    if (session.isRevoked()) {
      return next(new AppError('Session has been revoked. Please login again', 401));
    }

    const user = session.user;


    // Generate new access token
    const newAccessToken = generateToken(user.id);

    sendSuccess(res, 200, 'Token refreshed successfully', {
      accessToken: newAccessToken,
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    return next(error);
  }
};


// Google authentication - initiate
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// Google authentication - callback
exports.googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', async (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new AppError('Google authentication failed', 401));
    }

    try {
      // Generate JWT tokens
      const accessToken = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Hash refresh token before saving
      const refreshTokenHash = Session.hashToken(refreshToken);

      // Create new session in DB
      await Session.create({
        userId: user.id,
        refreshTokenHash,
        device: req.headers['user-agent'] || null,
        ip: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Check if user has role assigned
      const userRole = await UserRole.findOne({ where: { userId: user.id } });

      // You can redirect to frontend with tokens or send JSON response
      // For now, sending JSON response
      sendSuccess(res, 200, 'Google authentication successful', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accessToken,
        needsRoleSelection: !userRole
      });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
};

// Logout function - revoke current session
exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return next(new AppError('No active session found', 400));
    }

    // Hash the refresh token to find the session
    const refreshTokenHash = Session.hashToken(refreshToken);

    // Find and revoke the session
    const session = await Session.findOne({
      where: {
        userId: req.user.id,
        refreshTokenHash
      }
    });

    if (session) {
      await session.update({
        revokedAt: new Date()
      });
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken');

    sendSuccess(res, 200, 'Logged out successfully', null);
  } catch (error) {
    return next(error);
  }
};

// Logout from all devices - revoke all sessions for the user
exports.logoutAll = async (req, res, next) => {
  try {
    // Revoke all sessions for the user
    await Session.update(
      { revokedAt: new Date() },
      { 
        where: { 
          userId: req.user.id,
          revokedAt: null
        } 
      }
    );

    // Clear the refresh token cookie
    res.clearCookie('refreshToken');

    sendSuccess(res, 200, 'Logged out from all devices successfully', null);
  } catch (error) {
    return next(error);
  }
};

// Get all active sessions for the current user
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.findAll({
      where: {
        userId: req.user.id,
        revokedAt: null
      },
      attributes: ['id', 'device', 'ip', 'userAgent', 'createdAt', 'expiresAt'],
      order: [['createdAt', 'DESC']]
    });

    // Filter out expired sessions
    const activeSessions = sessions.filter(session => !session.isExpired());

    sendSuccess(res, 200, 'Active sessions retrieved successfully', {
      sessions: activeSessions,
      count: activeSessions.length
    });
  } catch (error) {
    return next(error);
  }
};

// Revoke a specific session
exports.revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      where: {
        id: sessionId,
        userId: req.user.id
      }
    });

    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    if (session.isRevoked()) {
      return next(new AppError('Session already revoked', 400));
    }

    await session.update({
      revokedAt: new Date()
    });

    sendSuccess(res, 200, 'Session revoked successfully', null);
  } catch (error) {
    return next(error);
  }
};
