const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const SocialMediaAccount = sequelize.define('SocialMediaAccount', {
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
    onDelete: 'CASCADE'
  },
  platform: {
    type: DataTypes.ENUM('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'),
    allowNull: false
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Platform-specific account ID'
  },
  accountName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Display name of the account'
  },
  accountUsername: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Username/handle of the account'
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL to profile picture'
  },
  
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'OAuth access token'
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'OAuth refresh token (if available)'
  },
  tokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Token expiration date'
  },
  platformData: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'platform', 'accountId'],
      name: 'unique_user_platform_account'
    }
  ]
});

User.hasMany(SocialMediaAccount, { foreignKey: 'userId', as: 'socialMediaAccounts' });
SocialMediaAccount.belongsTo(User, { foreignKey: 'userId' });

module.exports = SocialMediaAccount;

