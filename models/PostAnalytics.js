const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PostAnalytics = sequelize.define('PostAnalytics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  scheduledPostId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  note:{
    type: DataTypes.TEXT,
    allowNull: true
  },
  likes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  comments: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  shares: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reach: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  impressions: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fetchedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = PostAnalytics;