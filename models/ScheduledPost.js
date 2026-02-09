const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const SocialMediaAccount = require('./SocialMediaAccount');
const Campaign = require('./Campaign');

const ScheduledPost = sequelize.define('ScheduledPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  socialMediaAccountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'SocialMediaAccounts',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Campaigns',
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
  platform: {
    type: DataTypes.ENUM('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'),
    allowNull: false
  },
  contentType: {
    type: DataTypes.ENUM('post', 'story', 'reel', 'video', 'carousel', 'article', 'tweet', 'poll'),
    allowNull: false,
    defaultValue: 'post'
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
    type: DataTypes.ENUM('draft', 'scheduled', 'publishing', 'published', 'failed'),
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
      fields: ['userId', 'status']
    },
    {
      fields: ['scheduledAt', 'status']
    },
    {
      fields: ['platform', 'status']
    }
  ]
});

User.hasMany(ScheduledPost, { foreignKey: 'userId', as: 'scheduledPosts' });
ScheduledPost.belongsTo(User, { foreignKey: 'userId' });

SocialMediaAccount.hasMany(ScheduledPost, { foreignKey: 'socialMediaAccountId', as: 'scheduledPosts' });
ScheduledPost.belongsTo(SocialMediaAccount, { foreignKey: 'socialMediaAccountId' });

Campaign.hasMany(ScheduledPost, { foreignKey: 'campaignId', as: 'scheduledPosts' });
ScheduledPost.belongsTo(Campaign, { foreignKey: 'campaignId' });

module.exports = ScheduledPost;

