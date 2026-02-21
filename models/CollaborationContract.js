const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CollaborationContract = sequelize.define('CollaborationContract', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  collaborationRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'CollaborationRequests',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'completed', 'terminated'),
    defaultValue: 'draft',
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = CollaborationContract;
