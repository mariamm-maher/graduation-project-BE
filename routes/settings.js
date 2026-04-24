const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getSettings,
  updatePrivacySettings,
  updateNotificationPreferences,
  updateAccountSettings,
  changePassword,
  deleteAccount,
  exportUserData
} = require('../controllers/settingsController');

// All settings routes require authentication
router.use(authenticate);

// =======================
// SETTINGS MANAGEMENT
// =======================

// @route   GET /api/settings
// @desc    Get all user settings (account, privacy, notifications, preferences)
// @access  Private
router.get('/', getSettings);

// @route   PATCH /api/settings/account
// @desc    Update account settings (email, name, language, timezone)
// @access  Private
router.patch('/account', updateAccountSettings);

// @route   PATCH /api/settings/privacy
// @desc    Update privacy settings
// @access  Private
router.patch('/privacy', updatePrivacySettings);

// @route   PATCH /api/settings/notifications
// @desc    Update notification preferences
// @access  Private
router.patch('/notifications', updateNotificationPreferences);

// @route   POST /api/settings/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', changePassword);

// @route   POST /api/settings/export-data
// @desc    Export all user data (GDPR compliance)
// @access  Private
router.post('/export-data', exportUserData);

// @route   DELETE /api/settings/account
// @desc    Delete user account permanently
// @access  Private
router.delete('/account', deleteAccount);

module.exports = router;
