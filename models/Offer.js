const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Offer = sequelize.define('Offer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serviceListingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ServiceListings',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'The service listing that receives the offer'
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'The owner who makes the offer'
  },
  offerPrice: {
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
    // State machine: pending → negotiated → accepted | rejected | expired | withdrawn
    type: DataTypes.ENUM('pending', 'negotiated', 'accepted', 'rejected', 'expired', 'withdrawn'),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'negotiated', 'accepted', 'rejected', 'expired', 'withdrawn']]
    }
  }
}, {
  timestamps: true
});

module.exports = Offer;
