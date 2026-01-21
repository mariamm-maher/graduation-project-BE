const jwt = require('jsonwebtoken');

// Generate JWT Access Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

// Generate JWT Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key', {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

module.exports = { generateToken, generateRefreshToken };