const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { logAction } = require('../services/logServices');

// =======================
// GET USER SETTINGS
// =======================
exports.getSettings = async (req, res, next) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'image', 'createdAt', 'updatedAt',
        'privacySettings', 'notificationPreferences', 'twoFactorEnabled', 'language', 'timezone'
      ]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Return settings with defaults if not set
    const settings = {
      account: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.image,
        memberSince: user.createdAt,
        lastUpdated: user.updatedAt
      },
      privacy: user.privacySettings || {
        profileVisibility: 'public', // public, private, connections_only
        showEmail: false,
        showPhone: false,
        allowSearchByEmail: true,
        allowDataCollection: true,
        shareActivityStatus: true
      },
      notifications: user.notificationPreferences || {
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        newCollaborationRequests: true,
        collaborationUpdates: true,
        messages: true,
        systemAnnouncements: true,
        weeklyDigest: true
      },
      preferences: {
        language: user.language || 'en',
        timezone: user.timezone || 'UTC',
        twoFactorEnabled: user.twoFactorEnabled || false
      }
    };

    sendSuccess(res, 200, 'Settings retrieved successfully', settings);
  } catch (error) {
    return next(error);
  }
};

// =======================
// UPDATE PRIVACY SETTINGS
// =======================
exports.updatePrivacySettings = async (req, res, next) => {
  try {
    const { profileVisibility, showEmail, showPhone, allowSearchByEmail, 
            allowDataCollection, shareActivityStatus } = req.body;

    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Get current settings or defaults
    const currentSettings = user.privacySettings || {};

    // Update privacy settings
    const newSettings = {
      profileVisibility: profileVisibility || currentSettings.profileVisibility || 'public',
      showEmail: typeof showEmail === 'boolean' ? showEmail : currentSettings.showEmail || false,
      showPhone: typeof showPhone === 'boolean' ? showPhone : currentSettings.showPhone || false,
      allowSearchByEmail: typeof allowSearchByEmail === 'boolean' ? allowSearchByEmail : currentSettings.allowSearchByEmail || true,
      allowDataCollection: typeof allowDataCollection === 'boolean' ? allowDataCollection : currentSettings.allowDataCollection || true,
      shareActivityStatus: typeof shareActivityStatus === 'boolean' ? shareActivityStatus : currentSettings.shareActivityStatus || true
    };

    await user.update({ privacySettings: newSettings });

    // Log the action
    try {
      await logAction({
        req,
        action: 'UPDATE_PRIVACY_SETTINGS',
        entity: 'User',
        entityId: user.id,
        meta: { email: user.email }
      });
    } catch (logError) {
      // Non-blocking
    }

    sendSuccess(res, 200, 'Privacy settings updated successfully', { privacySettings: newSettings });
  } catch (error) {
    return next(error);
  }
};

// =======================
// UPDATE NOTIFICATION PREFERENCES
// =======================
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const { emailNotifications, pushNotifications, marketingEmails, newCollaborationRequests,
            collaborationUpdates, messages, systemAnnouncements, weeklyDigest } = req.body;

    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Get current preferences or defaults
    const currentPreferences = user.notificationPreferences || {};

    // Update notification preferences
    const newPreferences = {
      emailNotifications: typeof emailNotifications === 'boolean' ? emailNotifications : currentPreferences.emailNotifications || true,
      pushNotifications: typeof pushNotifications === 'boolean' ? pushNotifications : currentPreferences.pushNotifications || true,
      marketingEmails: typeof marketingEmails === 'boolean' ? marketingEmails : currentPreferences.marketingEmails || false,
      newCollaborationRequests: typeof newCollaborationRequests === 'boolean' ? newCollaborationRequests : currentPreferences.newCollaborationRequests || true,
      collaborationUpdates: typeof collaborationUpdates === 'boolean' ? collaborationUpdates : currentPreferences.collaborationUpdates || true,
      messages: typeof messages === 'boolean' ? messages : currentPreferences.messages || true,
      systemAnnouncements: typeof systemAnnouncements === 'boolean' ? systemAnnouncements : currentPreferences.systemAnnouncements || true,
      weeklyDigest: typeof weeklyDigest === 'boolean' ? weeklyDigest : currentPreferences.weeklyDigest || true
    };

    await user.update({ notificationPreferences: newPreferences });

    // Log the action
    try {
      await logAction({
        req,
        action: 'UPDATE_NOTIFICATION_PREFERENCES',
        entity: 'User',
        entityId: user.id,
        meta: { email: user.email }
      });
    } catch (logError) {
      // Non-blocking
    }

    sendSuccess(res, 200, 'Notification preferences updated successfully', { notificationPreferences: newPreferences });
  } catch (error) {
    return next(error);
  }
};

// =======================
// UPDATE ACCOUNT SETTINGS
// =======================
exports.updateAccountSettings = async (req, res, next) => {
  try {
    const { firstName, lastName, email, language, timezone } = req.body;

    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const updates = {};

    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (language !== undefined) updates.language = language;
    if (timezone !== undefined) updates.timezone = timezone;

    // Handle email change separately - check if email already exists
    if (email !== undefined && email !== user.email) {
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return next(new AppError('Email already in use by another account', 400));
      }
      updates.email = email.toLowerCase();
      updates.emailVerified = false; // Require re-verification
    }

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields to update', 400));
    }

    await user.update(updates);

    // Log the action
    try {
      await logAction({
        req,
        action: 'UPDATE_ACCOUNT_SETTINGS',
        entity: 'User',
        entityId: user.id,
        meta: { email: user.email, updates: Object.keys(updates) }
      });
    } catch (logError) {
      // Non-blocking
    }

    sendSuccess(res, 200, 'Account settings updated successfully', {
      account: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.image,
        language: user.language,
        timezone: user.timezone,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    return next(error);
  }
};

// =======================
// CHANGE PASSWORD (Alternative endpoint in settings)
// =======================
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Current password and new password are required', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters long', 400));
    }

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

    // Update password
    await user.update({ password: newPassword });

    // Log the action
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

// =======================
// DELETE ACCOUNT
// =======================
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password, confirmDelete } = req.body;

    if (!confirmDelete) {
      return next(new AppError('Please confirm account deletion', 400));
    }

    const { User, OwnerProfile, InfluencerProfile, Session, Campaign, Collaboration } = require('../models');
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verify password for non-OAuth users
    if (user.password) {
      if (!password) {
        return next(new AppError('Password is required to delete your account', 400));
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(new AppError('Password is incorrect', 401));
      }
    }

    const userEmail = user.email;
    const userId = user.id;

    // Delete related data first
    await OwnerProfile.destroy({ where: { userId } });
    await InfluencerProfile.destroy({ where: { userId } });
    await Session.destroy({ where: { userId } });

    // Soft delete or anonymize campaigns and collaborations instead of hard deleting
    // This maintains data integrity for other users involved
    await Campaign.update(
      { ownerId: null, status: 'archived' },
      { where: { ownerId: userId } }
    );

    await Collaboration.update(
      { status: 'terminated', terminationReason: 'User account deleted' },
      { where: { $or: [{ ownerId: userId }, { influencerId: userId }] } }
    );

    // Finally delete the user
    await user.destroy();

    // Log the action
    try {
      await logAction({
        req,
        action: 'DELETE_ACCOUNT',
        entity: 'User',
        entityId: userId,
        meta: { email: userEmail }
      });
    } catch (logError) {
      // Non-blocking
    }

    sendSuccess(res, 200, 'Account deleted successfully', null);
  } catch (error) {
    return next(error);
  }
};

// =======================
// EXPORT USER DATA (GDPR compliance)
// =======================
exports.exportUserData = async (req, res, next) => {
  try {
    const { User, OwnerProfile, InfluencerProfile, Campaign, Collaboration, SocialMediaAccount } = require('../models');
    
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'image', 'createdAt', 'updatedAt',
        'privacySettings', 'notificationPreferences', 'language', 'timezone'
      ]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Get all related data
    const ownerProfile = await OwnerProfile.findOne({ where: { userId: req.user.id } });
    const influencerProfile = await InfluencerProfile.findOne({ where: { userId: req.user.id } });
    const campaigns = await Campaign.findAll({ where: { ownerId: req.user.id } });
    const collaborations = await Collaboration.findAll({ 
      where: { $or: [{ ownerId: req.user.id }, { influencerId: req.user.id }] } 
    });
    const socialAccounts = await SocialMediaAccount.findAll({ where: { userId: req.user.id } });

    const userData = {
      user: user.toJSON(),
      ownerProfile: ownerProfile ? ownerProfile.toJSON() : null,
      influencerProfile: influencerProfile ? influencerProfile.toJSON() : null,
      campaigns: campaigns.map(c => c.toJSON()),
      collaborations: collaborations.map(c => c.toJSON()),
      socialMediaAccounts: socialAccounts.map(s => ({
        platform: s.platform,
        username: s.username,
        connectedAt: s.createdAt
      })),
      exportDate: new Date().toISOString()
    };

    // Log the action
    try {
      await logAction({
        req,
        action: 'EXPORT_USER_DATA',
        entity: 'User',
        entityId: user.id,
        meta: { email: user.email }
      });
    } catch (logError) {
      // Non-blocking
    }

    sendSuccess(res, 200, 'User data exported successfully', userData);
  } catch (error) {
    return next(error);
  }
};
