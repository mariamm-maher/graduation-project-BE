const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CollaborationTask = sequelize.define('CollaborationTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  collaborationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Collaborations', key: 'id' },
    onDelete: 'CASCADE'
  },
  taskName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(
      'todo',
      'in_progress',
      'in_review',
      'approved',   
      'rejected'
    ),
    defaultValue: 'todo',
    allowNull: false
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  platform: {
    type: DataTypes.ENUM(
      'instagram', 'tiktok', 'youtube',
      'facebook', 'twitter', 'linkedin',
      'snapchat', 'whatsapp', 'other'
    ),
    allowNull: true
  },
  contentType: {
    type: DataTypes.ENUM(
      'post', 'story', 'reel', 'video',
      'carousel', 'article', 'tweet', 'poll'
    ),
    allowNull: true
  },

  submissionNote: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submissionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewNote: {
    type: DataTypes.TEXT,
    allowNull: true
  },

}, {
  timestamps: true 
});

module.exports = CollaborationTask;