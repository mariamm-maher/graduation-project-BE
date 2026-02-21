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
    references: {
      model: 'Campaigns',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  influencerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  proposedBudget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = CollaborationRequest;
