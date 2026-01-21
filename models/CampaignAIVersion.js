const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CampaignAIVersion = sequelize.define('CampaignAIVersion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Campaigns',
      key: 'id',
    },
    onDelete: 'CASCADE'
  },
  versionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  generatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  strategy: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  execution: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  estimations: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: false
});

module.exports = CampaignAIVersion;
