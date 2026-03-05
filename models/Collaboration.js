const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Collaboration = sequelize.define('Collaboration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  collaborationRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'CollaborationRequests', key: 'id' },
    onDelete: 'RESTRICT'
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Campaigns', key: 'id' },
    onDelete: 'CASCADE'
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'RESTRICT'
  },
  influencerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'RESTRICT'
  },

  status: {
    type: DataTypes.ENUM(
      'pending_contract_sign',
      'live', // Accepted, contract not yet generated
      'in_progress',      // Contract exists, tasks underway
      'completed',        // All tasks approved
      'cancelled',        // Terminated after start        
    ),
    // FIX: default was 'PendingContract' which was NOT in the ENUM — caused crash
    defaultValue: 'pending_contract_sign',
    allowNull: false
  },

  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  timestamps: true
});

module.exports = Collaboration;