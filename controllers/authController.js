const passport = require('passport');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const { calculateOwnerProfileCompletion, calculateInfluencerProfileCompletion } = require('../utils/profileCompletion');
const { normalizeBrandToneFromBody } = require('../utils/normalizeBrandTone');
const { Session, UserRole } = require('../models');
const { logAction } = require('../services/logServices');
const sendEmail = require('../config/email');
const crypto = require('crypto');
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
          needsOnboarding: false,
          accessToken,
          roles
        });
      }

      // Check if user needs onboarding (based on their role)
      let needsOnboarding = false;
      
      if (roles.includes('INFLUENCER')) {
        const { InfluencerProfile } = require('../models');
        const influencerProfile = await InfluencerProfile.findOne({ 
          where: { userId: user.id },
          attributes: ['isOnboarded']
        });
        if (!influencerProfile || !influencerProfile.isOnboarded) {
          needsOnboarding = true;
        }
      } else if (roles.includes('OWNER')) {
        const { OwnerProfile } = require('../models');
        const ownerProfile = await OwnerProfile.findOne({ 
          where: { userId: user.id },
          attributes: ['isOnboarded']
        });
        if (!ownerProfile || !ownerProfile.isOnboarded) {
          needsOnboarding = true;
        }
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
        needsOnboarding: needsOnboarding,
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
    const rawRefreshToken = req.cookies?.refreshToken;
    const refreshToken = typeof rawRefreshToken === 'string'
      ? rawRefreshToken.trim().replace(/^["']|["']$/g, '')
      : '';

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 401));
    }

    if (refreshToken.split('.').length !== 3) {
      return next(new AppError('Invalid refresh token format', 401));
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
        refreshTokenHash,
        revokedAt: null
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!session) {
      return next(new AppError('Session not found. Please login again', 401));
    }

    if (!session.user) {
      return next(new AppError('Invalid session user. Please login again', 401));
    }

    if (session.user.id !== result.decoded.id) {
      return next(new AppError('Invalid session binding. Please login again', 401));
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
        redirectUrl.searchParams.append('needsOnboarding', 'false');
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
        redirectUrl.searchParams.append('needsOnboarding', 'false');
        return res.redirect(redirectUrl.toString());
      }

      // Check if user needs onboarding (based on their role)
      let needsOnboarding = false;
      
      if (roles.includes('INFLUENCER')) {
        const { InfluencerProfile } = require('../models');
        const influencerProfile = await InfluencerProfile.findOne({ 
          where: { userId: user.id },
          attributes: ['isOnboarded']
        });
        if (!influencerProfile || !influencerProfile.isOnboarded) {
          needsOnboarding = true;
        }
      } else if (roles.includes('OWNER')) {
        const { OwnerProfile } = require('../models');
        const ownerProfile = await OwnerProfile.findOne({ 
          where: { userId: user.id },
          attributes: ['isOnboarded']
        });
        if (!ownerProfile || !ownerProfile.isOnboarded) {
          needsOnboarding = true;
        }
      }

      // User has roles - successful sign-in
      try { 
        await logAction({ req, action: 'LOGIN', entity: 'Auth', entityId: user.id, meta: { email: user.email, method: 'Google', roles } }); 
      } catch (e) {}

      redirectUrl.searchParams.append('needsRoleSelection', 'false');
      redirectUrl.searchParams.append('needsOnboarding', needsOnboarding.toString());
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

    const allowed = [
      'brand_name',
      'product_or_service',
      'industry',
      'target_market',
      'targetAudience',
      'company_size',
      'unique_selling_point',
      'competitors',
      'has_previous_campaigns',
      'previous_campaign_description',
      'website',
      'platforms',
      'image',
      'brandTone',
      'isOnboarded',
      'isCompleted'
    ];

    let profile = await OwnerProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await OwnerProfile.create({ userId });
    }

    const updates = {};
    const normalisedBrandTone = normalizeBrandToneFromBody(req.body);
    if (normalisedBrandTone !== undefined) {
      updates.brandTone = normalisedBrandTone;
    }

    for (const key of allowed) {
      if (key === 'brandTone') continue;
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        let val = req.body[key];

        if ((key === 'target_market' || key === 'platforms' || key === 'competitors' || key === 'targetAudience') && typeof val === 'string') {
          try { val = JSON.parse(val); } catch (e) { /* leave as-is */ }
        }

        if (key === 'target_market') {
          if (!Array.isArray(val) || val.some((item) => typeof item !== 'string')) {
            return next(new AppError('target_market must be an array of strings', 400));
          }
        }

        if (key === 'has_previous_campaigns' && typeof val === 'string') {
          const normalized = val.trim().toLowerCase();
          if (normalized === 'true') val = true;
          else if (normalized === 'false') val = false;
          else return next(new AppError('has_previous_campaigns must be true or false', 400));
        }

        if (key === 'company_size') {
          const allowedCompanySizes = ['Solo', 'Small', 'Mid', 'Enterprise'];
          if (!allowedCompanySizes.includes(val)) {
            return next(new AppError('company_size must be one of: Solo, Small, Mid, Enterprise', 400));
          }
        }

        updates[key] = val;
      }
    }

    if (updates.has_previous_campaigns === true && !updates.previous_campaign_description) {
      return next(new AppError('previous_campaign_description is required when has_previous_campaigns is true', 400));
    }

    await profile.update(updates);

    const completion = calculateOwnerProfileCompletion(profile);
    await profile.update({ completionPercentage: completion });

    sendSuccess(res, 200, 'Owner profile updated', { profile, completionPercentage: completion });
  } catch (error) {
    return next(error);
  }
};

// =======================
// PASSWORD MANAGEMENT
// =======================

// Forgot password - request password reset
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const { User } = require('../models');
    const user = await User.findOne({ where: { email } });

    // Don't reveal if email exists or not (security best practice)
    if (!user) {
      return sendSuccess(res, 200, 'If that email exists, a password reset link has been sent', null);
    }

    // Check if user has a password (not OAuth-only user)
    if (!user.password) {
      return sendSuccess(res, 200, 'If that email exists, a password reset link has been sent', null);
    }

    // Generate reset token (plain text)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before storing in database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save hashed token and expiry to database (1 hour expiry)
    await user.update({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Email template
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${user.firstName},</p>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this, please ignore this email. Your password will not be changed.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `;

    const textMessage = `
Hello ${user.firstName},

You requested to reset your password. Click the link below to proceed:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email. Your password will not be changed.
    `;

    // MOCK EMAIL - Log reset URL to console (for development)
    console.log('\n========================================');
    console.log('🔑 PASSWORD RESET LINK (MOCK EMAIL)');
    console.log('========================================');
    console.log('Email would be sent to:', user.email);
    console.log('Reset URL:', resetUrl);
    console.log('========================================\n');

    // Log the password reset request
    try {
      await logAction({ 
        req, 
        action: 'REQUEST_PASSWORD_RESET', 
        entity: 'User', 
        entityId: user.id, 
        meta: { email: user.email, mock: true } 
      });
    } catch (logError) {
      // Non-blocking: log errors are not critical
    }

    sendSuccess(res, 200, 'Password reset link generated! Check server console for the link.', {
      mockResetUrl: resetUrl,
      email: user.email
    });
  } catch (error) {
    return next(error);
  }
};

// Reset password using token
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return next(new AppError('Token and password are required', 400));
    }

    // Validate password strength
    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const { User } = require('../models');
    
    // Find user with matching token and non-expired token
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    // Update password (will be auto-hashed by User model hook)
    await user.update({
      password: password,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    // Revoke all existing sessions for security
    await Session.update(
      { revokedAt: new Date() },
      { 
        where: { 
          userId: user.id,
          revokedAt: null
        } 
      }
    );

    // Log the password reset
    try {
      await logAction({ 
        req, 
        action: 'PASSWORD_RESET', 
        entity: 'User', 
        entityId: user.id, 
        meta: { email: user.email } 
      });
    } catch (logError) {
      // Non-blocking
    }

    sendSuccess(res, 200, 'Password has been reset successfully. Please login with your new password.', null);
  } catch (error) {
    return next(error);
  }
};

// Change password (authenticated user)
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Current password and new password are required', 400));
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters long', 400));
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return next(new AppError('New password must be different from current password', 400));
    }

    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if user has a password (not OAuth-only user)
    if (!user.password) {
      return next(new AppError('Cannot change password for OAuth-only accounts. Please set a password first.', 400));
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password (will be auto-hashed by User model hook)
    await user.update({ password: newPassword });

    // Log the password change
    try {
      await logAction({ 
        req, 
        action: 'CHANGE_PASSWORD', 
        entity: 'User', 
        entityId: user.id, 
        meta: { email: user.email } 
      });
    } catch (logError) {
      // Non-blocking
    }

    sendSuccess(res, 200, 'Password changed successfully', null);
  } catch (error) {
    return next(error);
  }
};

// Switch active role (for users with multiple roles)
exports.switchRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    if (!role) {
      return next(new AppError('Role is required', 400));
    }

    // Validate role
    const validRoles = ['OWNER', 'INFLUENCER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return next(new AppError('Invalid role', 400));
    }

    const { User, Role } = require('../models');

    // Get user with roles
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const userRoles = user.roles ? user.roles.map(r => r.name) : [];

    // Check if user has the requested role
    if (!userRoles.includes(role)) {
      return next(new AppError(`You do not have the ${role} role`, 403));
    }

    // Generate new tokens with the switched role as primary
    const roleId = role === 'ADMIN' ? 3 : role === 'OWNER' ? 1 : 2;
    const accessToken = generateToken(userId, roleId);
    const refreshToken = generateRefreshToken(userId);

    // Update session
    await Session.upsert({
      userId: userId,
      token: accessToken,
      refreshToken: refreshToken,
      roleId: roleId,
      lastActive: new Date()
    });

    // Set refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    // Log the role switch
    try {
      await logAction({
        req,
        action: 'SWITCH_ROLE',
        entity: 'User',
        entityId: userId,
        meta: { fromRole: req.user.role, toRole: role }
      });
    } catch (logError) {
      // Non-blocking
    }

    sendSuccess(res, 200, `Switched to ${role} successfully`, {
      accessToken,
      role,
      roleId,
      roles: userRoles
    });
  } catch (error) {
    return next(error);
  }
};

// =======================
// ONBOARDING
// =======================

// Influencer onboarding - complete profile setup
exports.onboardInfluencer = async (req, res, next) => {
  try {
    const { InfluencerProfile, User, Role } = require('../models');
    const userId = req.query.id;
    if (!userId) return next(new AppError('User id is required as a query parameter (?id=)', 400));

    // Verify user has influencer role
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['name'],
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const roles = user.roles ? user.roles.map(r => r.name) : [];
    if (!roles.includes('INFLUENCER')) {
      return next(new AppError('User does not have influencer role', 403));
    }

    // Find or create influencer profile
    let profile = await InfluencerProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await InfluencerProfile.create({ userId });
    }

    // Check if already onboarded
    if (profile.isOnboarded) {
      return next(new AppError('Profile is already onboarded. Use the update endpoint to modify your profile.', 400));
    }

    // Allowed onboarding fields (all fields from onboarding questions)
    const allowedFields = [
      'bio', 'location', 'image', 'primaryPlatform', 'socialMediaLinks',
      'followersCount', 'engagementRate', 'categories', 'contentTypes',
      'collaborationTypes', 'audienceAgeRange', 'audienceGender',
      'audienceLocation', 'interests'
    ];

    // Required fields for onboarding
    const requiredFields = ['bio', 'location', 'primaryPlatform'];

    // Validate required fields
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new AppError(`${field} is required for onboarding`, 400));
      }
    }

    // Build updates object
    const updates = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        let val = req.body[key];
        
        // Parse JSON strings for complex types
        const jsonFields = ['socialMediaLinks', 'categories', 'contentTypes', 'collaborationTypes', 'interests'];
        if (jsonFields.includes(key) && typeof val === 'string') {
          try { 
            val = JSON.parse(val); 
          } catch (e) { 
            return next(new AppError(`Invalid JSON format for ${key}`, 400));
          }
        }
        
        updates[key] = val;
      }
    }

    // Set onboarding flag
    updates.isOnboarded = true;

    // Update profile
    await profile.update(updates);

    // Calculate and update completion percentage
    const completion = calculateInfluencerProfileCompletion(profile);
    await profile.update({ completionPercentage: completion });

    // Log onboarding completion
    try {
      await logAction({ 
        req, 
        action: 'COMPLETE_ONBOARDING', 
        entity: 'InfluencerProfile', 
        entityId: profile.id, 
        meta: { userId, completionPercentage: completion } 
      });
    } catch (logError) {
      // Non-blocking
    }

    sendSuccess(res, 200, 'Influencer onboarding completed successfully', { 
      profile, 
      completionPercentage: completion,
      isOnboarded: true
    });
  } catch (error) {
    return next(error);
  }
};

// Owner onboarding - complete profile setup
exports.onboardOwner = async (req, res, next) => {
  try {
    const { OwnerProfile, User, Role } = require('../models');
    const userId = req.query.id;
    if (!userId) return next(new AppError('User id is required as a query parameter (?id=)', 400));

    // Verify user has owner role
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['name'],
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const roles = user.roles ? user.roles.map(r => r.name) : [];
    if (!roles.includes('OWNER')) {
      return next(new AppError('User does not have owner role', 403));
    }

    // Find or create owner profile
    let profile = await OwnerProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await OwnerProfile.create({ userId });
    }

    // Check if already onboarded
    if (profile.isOnboarded) {
      return next(new AppError('Profile is already onboarded. Use the update endpoint to modify your profile.', 400));
    }

    // Allowed onboarding fields based on latest owner profile schema
    const allowedFields = [
      'brand_name',
      'product_or_service',
      'industry',
      'target_market',
      'targetAudience',
      'company_size',
      'unique_selling_point',
      'competitors',
      'has_previous_campaigns',
      'previous_campaign_description',
      'website',
      'platforms',
      'image',
      'brandTone',
      'isOnboarded',
      'isCompleted'
    ];

    // Required fields for onboarding
    const requiredFields = ['brand_name', 'product_or_service'];

    // Validate required fields
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new AppError(`${field} is required for onboarding`, 400));
      }
    }

    // Build updates object
    const updates = {};
    const normalisedBrandTone = normalizeBrandToneFromBody(req.body);
    if (normalisedBrandTone !== undefined) {
      updates.brandTone = normalisedBrandTone;
    }

    for (const key of allowedFields) {
      if (key === 'brandTone') continue;
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        let val = req.body[key];
        
        // Parse JSON strings for array/object types
        const jsonFields = ['target_market', 'competitors', 'platforms', 'targetAudience'];
        if (jsonFields.includes(key) && typeof val === 'string') {
          try { 
            val = JSON.parse(val); 
          } catch (e) { 
            return next(new AppError(`Invalid JSON format for ${key}`, 400));
          }
        }

        if (key === 'target_market') {
          if (!Array.isArray(val) || val.some((item) => typeof item !== 'string')) {
            return next(new AppError('target_market must be an array of strings', 400));
          }
        }

        if (key === 'has_previous_campaigns' && typeof val === 'string') {
          const normalized = val.trim().toLowerCase();
          if (normalized === 'true') val = true;
          else if (normalized === 'false') val = false;
          else return next(new AppError('has_previous_campaigns must be true or false', 400));
        }

        if (key === 'company_size') {
          const allowedCompanySizes = ['Solo', 'Small', 'Mid', 'Enterprise'];
          if (!allowedCompanySizes.includes(val)) {
            return next(new AppError('company_size must be one of: Solo, Small, Mid, Enterprise', 400));
          }
        }
        
        updates[key] = val;
      }
    }

    if (updates.has_previous_campaigns === true && !updates.previous_campaign_description) {
      return next(new AppError('previous_campaign_description is required when has_previous_campaigns is true', 400));
    }

    // Set onboarding flag
    updates.isOnboarded = true;

    // Update profile
    await profile.update(updates);

    // Calculate and update completion percentage
    const completion = calculateOwnerProfileCompletion(profile);
    await profile.update({ completionPercentage: completion });

    // Log onboarding completion
    try {
      await logAction({ 
        req, 
        action: 'COMPLETE_ONBOARDING', 
        entity: 'OwnerProfile', 
        entityId: profile.id, 
        meta: { userId, completionPercentage: completion } 
      });
    } catch (logError) {
      // Non-blocking
    }

    sendSuccess(res, 200, 'Owner onboarding completed successfully', { 
      profile, 
      completionPercentage: completion,
      isOnboarded: true
    });
  } catch (error) {
    return next(error);
  }
};