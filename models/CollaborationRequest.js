const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CollaborationRequest = sequelize.define('CollaborationRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Campaigns', key: 'id' },
    onDelete: 'CASCADE'
  },
  // FIX: added ownerId — who sent this request
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE'
  },
  influencerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('pending', 'negotiating', 'accepted', 'rejected', 'cancelled', 'expired'),
    defaultValue: 'pending',
    allowNull: false
  },
  proposedBudget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  counterPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responseMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['campaignId', 'influencerId'],
      name: 'unique_active_collab_request'
    }
  ]
});

module.exports = CollaborationRequest;