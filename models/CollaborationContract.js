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

  // Format: [{ title, description, platform, contentType, dueDate }]
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
    type: DataTypes.ENUM('draft', 'sent', 'signed'),
    defaultValue: 'draft',   // FIX: auto-signed on acceptance, so starts as 'active' not 'draft'
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = CollaborationContract;