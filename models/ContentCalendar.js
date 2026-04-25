const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContentCalendar = sequelize.define('ContentCalendar', {
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
  day: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  platform: {
    type: DataTypes.ENUM('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'),
    allowNull: false
  },
  contentType: {
    type: DataTypes.ENUM('video', 'carousel', 'story', 'reel', 'post', 'article'),
    allowNull: false
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  task: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'posted', 'failed'),
    allowNull: false
  }
}, {
  timestamps: false
});

module.exports = ContentCalendar;
