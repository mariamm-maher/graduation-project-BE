const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Proposal = sequelize.define('Proposal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serviceRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ServiceRequests',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'The service request that receives the proposal'
  },
  influencerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'The influencer who makes the proposal'
  },
  proposedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'accepted', 'rejected']]
    }
  }
}, {
  timestamps: true
});

module.exports = Proposal;
