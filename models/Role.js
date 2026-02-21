const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.ENUM('OWNER', 'INFLUENCER', 'ADMIN'),
    allowNull: false,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = Role;