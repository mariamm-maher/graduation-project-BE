const express = require('express');
const passport = require('passport');
const { 
  signup, 
  login,
  selectRole,
  refreshAccessToken
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

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

module.exports = router;  