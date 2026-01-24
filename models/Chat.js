const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Chat = sequelize.define('Chat', {
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
    comment: 'The user (owner) who initiated the chat'
  },
  otherUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'The influencer in the chat (userId of user with INFLUENCER role)'
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Campaigns',
      key: 'id'
    },
    comment: 'Optional: Associated campaign if chat is related to a campaign'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp of the last message in the chat'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Chat;