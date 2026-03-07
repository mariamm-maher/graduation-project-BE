const express = require('express');
const passport = require('passport');
const { 
  signup, 
  login,
  selectRole,
  refreshAccessToken,
  googleAuth,
  googleAuthCallback,
  logout,
  logoutAll,
  getSessions,
  revokeSession,
  getProfile,
  onboardInfluencer,
  onboardOwner
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', signup);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/select-role
// @desc    Assign role to user
// @access  Public
router.post('/select-role', selectRole);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', refreshAccessToken);

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', googleAuth);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', googleAuthCallback);

// @route   POST /api/auth/logout
// @desc    Logout current session
// @access  Private
router.post('/logout', authenticate, logout);

// @route   POST /api/auth/logout-all
// @desc    Logout from all devices
// @access  Private
router.post('/logout-all', authenticate, logoutAll);

// @route   GET /api/auth/sessions
// @desc    Get all active sessions
// @access  Private
router.get('/sessions', authenticate, getSessions);

// @route   DELETE /api/auth/sessions/:sessionId
// @desc    Revoke a specific session
// @access  Private
router.delete('/sessions/:sessionId', authenticate, revokeSession);

// @route   GET /api/auth/profile
// @desc    Get user profile with completion percentage
// @access  Private
router.get('/profile', authenticate, getProfile);
// @route   PATCH /api/auth/profile/influencer
// @desc    Update influencer profile
// @access  Private
router.patch('/profile/influencer', authenticate, require('../controllers/authController').updateInfluencerProfile);

// @route   PATCH /api/auth/profile/owner
// @desc    Update owner profile
// @access  Private
router.patch('/profile/owner', authenticate, require('../controllers/authController').updateOwnerProfile);

// =======================
// PASSWORD MANAGEMENT
// =======================

// @route   POST /api/auth/forgot-password
// @desc    Request password reset (send email with token)
// @access  Public
router.post('/forgot-password', require('../controllers/authController').forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', require('../controllers/authController').resetPassword);

// @route   POST /api/auth/change-password
// @desc    Change password (authenticated user)
// @access  Private
router.post('/change-password', authenticate, require('../controllers/authController').changePassword);

// =======================
// ONBOARDING
// =======================

// @route   PATCH /api/auth/influencer/onboarding
// @desc    Complete influencer onboarding (one-time setup)
// @access  Private (requires INFLUENCER role)
router.patch('/influencer/onboarding', authenticate, onboardInfluencer);

// @route   PATCH /api/auth/owner/onboarding
// @desc    Complete owner onboarding (one-time setup)
// @access  Private (requires OWNER role)
router.patch('/owner/onboarding', authenticate, onboardOwner);

module.exports = router;  