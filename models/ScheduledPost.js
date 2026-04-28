const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ScheduledPost = sequelize.define('ScheduledPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  channelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Channels',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  CollaborationTaskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'CollaborationTasks',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  contentCalendarId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ContentCalendars',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Post caption/text content'
  },
  mediaUrls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    comment: 'Array of media URLs (images, videos)'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'When the post should be published'
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'published', 'failed'),
    allowNull: false,
    defaultValue: 'draft'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the post was actually published'
  },
  platformPostId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID returned by platform after publishing'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if publishing failed'
  },
  retryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of retry attempts'
  },
  // Additional options
  options: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Platform-specific options (hashtags, mentions, location, etc.)'
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['scheduledAt', 'status']
    },
  ]
});

module.exports = ScheduledPost;

