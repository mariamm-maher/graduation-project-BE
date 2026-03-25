const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CollaborationContract = sequelize.define('CollaborationContract', {

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  collaborationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'Collaborations', key: 'id' },
    onDelete: 'CASCADE'
  },

  agreedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },

  deliverables: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },

  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  status: {
    type: DataTypes.ENUM(
      'sent',
      'partially_signed',
      'signed',
      'cancelled'
    ),
    defaultValue: 'sent'
  },

  ownerSigned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  influencerSigned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  ownerSignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  influencerSignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  contractFileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },

  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, { timestamps: true })

module.exports = CollaborationContract;