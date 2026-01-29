const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CollaborationBoard = sequelize.define('CollaborationBoard', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  collaborationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Collaborations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = CollaborationBoard;
