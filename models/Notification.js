const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Notification = sequelize.define('Notification', {
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
    }
  },

  type: {
    type: DataTypes.ENUM(
      'CAMPAIGN_INVITATION',
      'CAMPAIGN_PUBLISHED',
      'CAMPAIGN_APPROVED',
      'CAMPAIGN_REJECTED',
      'AI_CAMPAIGN_READY',

      'CONTRACT_CREATED',
      'CONTRACT_SENT',
      'CONTRACT_SIGNED',

      'OFFER_MADE',
      'OFFER_ACCEPTED',
      'OFFER_REJECTED',

      'PROPOSAL_SUBMITTED',
      'PROPOSAL_ACCEPTED',
      'PROPOSAL_REJECTED',

      'TASK_ASSIGNED',
      'TASK_STARTED',
      'TASK_SUBMITTED',
      'TASK_APPROVED',
      'TASK_REJECTED',
      'TASK_FINAL_REJECTED',

      'FILE_UPLOADED',
      'MESSAGE_RECEIVED'
    ),
    allowNull: false
  },

  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  entityType: {
    type: DataTypes.STRING
  },

  entityId: {
    type: DataTypes.INTEGER
  },

  metadata: {
    type: DataTypes.JSONB
  },

  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  readAt: {
    type: DataTypes.DATE
  }

}, {
  timestamps: true
});

module.exports = Notification;