const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getSettings,
  updateAccountSettings,
  changePassword,
  deleteAccount
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
// @desc    Update account settings (email, name)
// @access  Private
router.patch('/account', updateAccountSettings);

// @route   POST /api/settings/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', changePassword);

// @route   DELETE /api/settings/account
// @desc    Delete user account permanently
// @access  Private
router.delete('/account', deleteAccount);

module.exports = router;
