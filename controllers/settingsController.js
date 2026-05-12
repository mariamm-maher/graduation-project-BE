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
      attributes: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Return only basic account settings
    const settings = {
      account: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        memberSince: user.createdAt,
        lastUpdated: user.updatedAt
      }
    };

    sendSuccess(res, 200, 'Settings retrieved successfully', settings);
  } catch (error) {
    return next(error);
  }
};

// =======================
// UPDATE ACCOUNT SETTINGS
// =======================
exports.updateAccountSettings = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;

    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const updates = {};

    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();

    // Handle email change separately - check if email already exists
    if (email !== undefined && email !== user.email) {
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return next(new AppError('Email already in use by another account', 400));
      }
      updates.email = email.toLowerCase();
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
        lastName: user.lastName
      }
    });
  } catch (error) {
    return next(error);
  }
};

// =======================
// CHANGE PASSWORD
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
      return next(new AppError('Cannot change password for OAuth-only accounts', 400));
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

    const { User, OwnerProfile, InfluencerProfile, Session } = require('../models');
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
