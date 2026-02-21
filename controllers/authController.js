const passport = require('passport');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const { calculateOwnerProfileCompletion, calculateInfluencerProfileCompletion } = require('../utils/profileCompletion');
const { Session, UserRole } = require('../models');
const { logAction } = require('../services/logServices');
const e = require('express');
// Signup function
exports.signup = (req, res, next) => {
  passport.authenticate('local-signup', async (err, user, info) => {
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

    // Log the user creation (fire-and-forget)
    try {
      await logAction({ req, action: 'CREATE_USER', entity: 'User', entityId: user.id, meta: { email: user.email } });
    } catch (e) {
      // non-blocking: swallow logging errors
    }
  })(req, res, next);
};
// Select role function
exports.selectRole = async (req, res, next) => {
  try {
    let { userId, roleId } = req.body;


    if (!userId || !roleId) {
      return next(new AppError('UserId and roleId are required', 400));
    }

    const parsedRoleId = Number(String(roleId).trim());

    if (Number.isNaN(parsedRoleId)) {
      return next(new AppError('Invalid roleId', 400));
    }

    //  BLOCK ADMIN ROLE (id = 3)
    if (parsedRoleId === 3) {
      return next(
        new AppError('ADMIN role is reserved and cannot be assigned to other users', 403)
      );
    }

    const { User, Role, UserRole, OwnerProfile, InfluencerProfile } =
      require('../models');

    // Check user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check role exists
    const role = await Role.findByPk(parsedRoleId);
    if (!role) {
      return next(new AppError('Role not found', 404));
    }

    // Extra safety: block ADMIN by name
    if (role.name.toUpperCase() === 'ADMIN') {
      return next(
        new AppError('ADMIN role is reserved and cannot be assigned to other users', 403)
      );
    }

    // Prevent duplicate role
    const existingUserRole = await UserRole.findOne({
      where: { userId, roleId: parsedRoleId }
    });

    if (existingUserRole) {
      return next(new AppError('User already has this role', 400));
    }

    // Assign role
    await UserRole.create({
      userId,
      roleId: parsedRoleId
    });

    // Create role profile if needed
    if (role.name === 'OWNER') {
      const existing = await OwnerProfile.findOne({ where: { userId } });
      if (!existing) {
        await OwnerProfile.create({ userId });
      }
    }

    if (role.name === 'INFLUENCER') {
      const existing = await InfluencerProfile.findOne({ where: { userId } });
      if (!existing) {
        await InfluencerProfile.create({ userId });
      }
    }

    // Success response
    sendSuccess(res, 201, 'Role assigned successfully', {
      userId,
      roleId: parsedRoleId,
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
        refreshTokenHash, // Stores hashed token
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

      // 5️ Fetch user's roles and check if the user needs role selection
      const { User, Role } = require('../models');
      const userWithRoles = await User.findByPk(user.id, {
        attributes: ['id', 'email', 'firstName', 'lastName'],
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['name'],
            through: { attributes: [] }
          }
        ]
      });

      const roles = (userWithRoles && userWithRoles.roles) ? userWithRoles.roles.map(r => r.name) : [];

      if (!roles || roles.length === 0) {
        // Log login attempt (no role yet)
        try { await logAction({ req, action: 'LOGIN', entity: 'Auth', entityId: user.id, meta: { email: user.email, roles } }); } catch (e) {}
        return sendSuccess(res, 200, 'Login successful, role selection required', {
          userId: user.id,
          email: user.email,
          needsRoleSelection: true,
          accessToken,
          roles
        });
      }

      // 6️ Return success for user with role(s)
      try { await logAction({ req, action: 'LOGIN', entity: 'Auth', entityId: user.id, meta: { email: user.email, roles } }); } catch (e) {}
      sendSuccess(res, 200, 'Login successful', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accessToken,
        needsRoleSelection: false,
        roles
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

// Get user profile with completion percentage
exports.getProfile = async (req, res, next) => {
  try {
    const { User, Role, OwnerProfile, InfluencerProfile } = require('../models');
    
    // Fetch user with roles
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt'],
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const roles = user.roles ? user.roles.map(r => r.name) : [];
    
    // Initialize response structure
    const profileData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: roles,
        createdAt: user.createdAt
      },
      // Role-specific sections (populated only if applicable)
      ownerProfile: null,
      influencerProfile: null,
      // Computed percentages (calculated on-the-fly, no DB mutation)
      completion: {
        owner: 0,
        influencer: 0
      }
    };

    // Parallel fetch for potential profiles if roles match
    // Note: A user might have both roles
    const promises = [];
    
    if (roles.includes('OWNER')) {
      promises.push(
        OwnerProfile.findOne({ where: { userId: user.id } })
          .then(profile => {
            if (profile) {
              profileData.ownerProfile = profile;
              profileData.completion.owner = calculateOwnerProfileCompletion(profile);
            }
          })
      );
    }

    if (roles.includes('INFLUENCER')) {
      promises.push(
        InfluencerProfile.findOne({ where: { userId: user.id } })
          .then(profile => {
            if (profile) {
              profileData.influencerProfile = profile;
              profileData.completion.influencer = calculateInfluencerProfileCompletion(profile);
            }
          })
      );
    }

    await Promise.all(promises);

    // Simplified flattened response for single-role users (backward compatibility/convenience)
    // If a user has primarily one role, you might want a top-level "completionPercentage"
    // matching that role to make frontend simple.
    if (profileData.ownerProfile && !profileData.influencerProfile) {
      profileData.profile = profileData.ownerProfile;
      profileData.completionPercentage = profileData.completion.owner;
    } else if (profileData.influencerProfile && !profileData.ownerProfile) {
      profileData.profile = profileData.influencerProfile;
      profileData.completionPercentage = profileData.completion.influencer;
    } else {
      // If multiple roles or no profiles, leave 'profile' undefined or null
      // and let client use the specific ownerProfile/influencerProfile fields
      profileData.profile = null;
      profileData.completionPercentage = 0;
    }

    sendSuccess(res, 200, 'Profile retrieved successfully', profileData);
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
  passport.authenticate('google', async (err, data, info) => {
    if (err) {
      return next(err);
    }

    if (!data || !data.user) {
      return next(new AppError('Google authentication failed', 401));
    }

    const { user, isNewUser } = data;

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
        ip: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Handle Sign-Up (new user)
      if (isNewUser) {
        // Log user creation (fire-and-forget)
        try {
          await logAction({ req, action: 'CREATE_USER', entity: 'User', entityId: user.id, meta: { email: user.email, method: 'Google' } });
        } catch (e) {
          // non-blocking: swallow logging errors
        }

        // Redirect to frontend with user data
        const redirectUrl = new URL('http://localhost:5173/auth/google/callback');
        redirectUrl.searchParams.append('userId', user.id);
        redirectUrl.searchParams.append('email', user.email);
        redirectUrl.searchParams.append('firstName', user.firstName);
        redirectUrl.searchParams.append('lastName', user.lastName);
        redirectUrl.searchParams.append('accessToken', accessToken);
        redirectUrl.searchParams.append('needsRoleSelection', 'true');
        redirectUrl.searchParams.append('roles', JSON.stringify([]));
        
        return res.redirect(redirectUrl.toString());
      }

      // Handle Sign-In (existing user) - same logic as regular login
      const { User: UserModel, Role } = require('../models');
      const userWithRoles = await UserModel.findByPk(user.id, {
        attributes: ['id', 'email', 'firstName', 'lastName'],
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['name'],
            through: { attributes: [] }
          }
        ]
      });

      const roles = (userWithRoles && userWithRoles.roles) ? userWithRoles.roles.map(r => r.name) : [];

      // Build redirect URL with user data
      const redirectUrl = new URL('http://localhost:5173/auth/google/callback');
      redirectUrl.searchParams.append('userId', user.id);
      redirectUrl.searchParams.append('email', user.email);
      redirectUrl.searchParams.append('firstName', user.firstName);
      redirectUrl.searchParams.append('lastName', user.lastName);
      redirectUrl.searchParams.append('accessToken', accessToken);
      redirectUrl.searchParams.append('roles', JSON.stringify(roles));

      // If user doesn't have roles yet (edge case)
      if (!roles || roles.length === 0) {
        // Log login attempt (no role yet)
        try { 
          await logAction({ req, action: 'LOGIN', entity: 'Auth', entityId: user.id, meta: { email: user.email, method: 'Google', roles } }); 
        } catch (e) {}
        
        redirectUrl.searchParams.append('needsRoleSelection', 'true');
        return res.redirect(redirectUrl.toString());
      }

      // User has roles - successful sign-in
      try { 
        await logAction({ req, action: 'LOGIN', entity: 'Auth', entityId: user.id, meta: { email: user.email, method: 'Google', roles } }); 
      } catch (e) {}

      redirectUrl.searchParams.append('needsRoleSelection', 'false');
      res.redirect(redirectUrl.toString());
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
};

// Update influencer profile
exports.updateInfluencerProfile = async (req, res, next) => {
  try {
    const { InfluencerProfile } = require('../models');
    const userId = req.user.id;

    // Allowed fields to update
    const allowed = ['bio','image','location','socialMediaLinks','primaryPlatform','followersCount','engagementRate','categories','contentTypes','collaborationTypes','audienceAgeRange','audienceGender','audienceLocation','interests','isOnboarded'];

    // Find or create profile
    let profile = await InfluencerProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await InfluencerProfile.create({ userId });
    }

    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        let val = req.body[key];
        // Attempt to parse JSON strings for complex types
        if ((key === 'socialMediaLinks' || key === 'categories' || key === 'contentTypes' || key === 'collaborationTypes' || key === 'interests') && typeof val === 'string') {
          try { val = JSON.parse(val); } catch (e) { /* leave as-is */ }
        }
        updates[key] = val;
      }
    }

    await profile.update(updates);

    // Recalculate completion and persist
    const completion = calculateInfluencerProfileCompletion(profile);
    await profile.update({ completionPercentage: completion });

    sendSuccess(res, 200, 'Influencer profile updated', { profile, completionPercentage: completion });
  } catch (error) {
    return next(error);
  }
};

// Update owner profile
exports.updateOwnerProfile = async (req, res, next) => {
  try {
    const { OwnerProfile } = require('../models');
    const userId = req.user.id;

    const allowed = ['businessName','businessType','industry','location','description','image','website','phoneNumber','platformsUsed','primaryMarketingGoal','targetAudience','isOnboarded'];

    let profile = await OwnerProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await OwnerProfile.create({ userId });
    }

    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        let val = req.body[key];
        if ((key === 'platformsUsed' || key === 'targetAudience') && typeof val === 'string') {
          try { val = JSON.parse(val); } catch (e) { /* leave as-is */ }
        }
        updates[key] = val;
      }
    }

    await profile.update(updates);

    const completion = calculateOwnerProfileCompletion(profile);
    await profile.update({ completionPercentage: completion });

    sendSuccess(res, 200, 'Owner profile updated', { profile, completionPercentage: completion });
  } catch (error) {
    return next(error);
  }
};