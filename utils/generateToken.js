const jwt = require('jsonwebtoken');

// Generate JWT Access Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET , {
    expiresIn: process.env.JWT_EXPIRE 
  });
};

// Generate JWT Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET , {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

// Verify JWT Token
const verifyToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret || process.env.JWT_SECRET);
    return { valid: true, decoded, error: null };
  } catch (error) {
    return { 
      valid: false, 
      decoded: null, 
      error: {
        name: error.name,
        message: error.message,
        expiredAt: error.expiredAt || null
      }
    };
  }
};

// Verify Access Token
const verifyAccessToken = (token) => {
  return verifyToken(token, process.env.JWT_SECRET);
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  return verifyToken(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = { 
  generateToken, 
  generateRefreshToken,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken
};