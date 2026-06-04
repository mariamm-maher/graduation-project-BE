const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Campaign = sequelize.define('Campaign', {
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
    }
  },
  campaignName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  lifecycleStage: {
    type: DataTypes.ENUM('draft', 'ai_generated', 'saved', 'active', 'completed', 'cancelled'),
    defaultValue: 'ai_generated',
    allowNull: false
  },

  campaign_goal: {
    type: DataTypes.ENUM('Awareness', 'Leads', 'Sales', 'Retention', 'Re-engagement'),
    allowNull: true
  },
 
  budget_amount: {
    type: DataTypes.FLOAT,
    allowNull: true
  },

  budget_currency: {
    type: DataTypes.STRING,
    allowNull: true
  },
  campaign_duration_weeks: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  version_history:{
    type: DataTypes.JSONB,
    allowNull:true
  },
  inputs:{
    type: DataTypes.JSONB,
    allowNull:true
  },
  currentOutput:{
    type: DataTypes.JSONB,
    allowNull:true
  }
 
}, {
  timestamps: true
});

module.exports = Campaign;
