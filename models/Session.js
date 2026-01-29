const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const crypto = require('crypto');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  refreshTokenHash: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Hashed refresh token for security'
  },
  device: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Device type (mobile, desktop, tablet, etc.)'
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIP: true
    },
    comment: 'IP address of the client'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent string from the browser'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'When the refresh token expires'
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the session was revoked (for logout)'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false, // We're managing createdAt manually
  tableName: 'Sessions',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['refreshTokenHash']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

// Static method to hash refresh token
Session.hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Instance method to check if session is expired
Session.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Instance method to check if session is revoked
Session.prototype.isRevoked = function() {
  return this.revokedAt !== null;
};

// Instance method to check if session is valid
Session.prototype.isValid = function() {
  return !this.isExpired() && !this.isRevoked();
};

module.exports = Session;
