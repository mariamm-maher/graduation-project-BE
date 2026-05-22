const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ScheduledPost = sequelize.define(
  'ScheduledPost',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    CollaborationTaskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    contentCalendarId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    mediaUrls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },

    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        'draft',
        'scheduled',
        'published',
        'failed'
      ),
      defaultValue: 'draft',
    },

    publishedAt: {
      type: DataTypes.DATE,
    },

    platformPostId: {
      type: DataTypes.STRING,
    },

    errorMessage: {
      type: DataTypes.TEXT,
    },

    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    options: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },

  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['scheduledAt', 'status'],
      },
    ],
  }
);

module.exports = ScheduledPost;