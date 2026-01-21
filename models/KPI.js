const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Campaign = require('./Campaign');

const KPI = sequelize.define('KPI', {
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
  metric: {
    type: DataTypes.ENUM('impressions', 'reach', 'engagement_rate', 'conversions', 'ROAS', 'CPA', 'CTR'),
    allowNull: false
  },
  targetValue: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false
});

Campaign.hasMany(KPI, { foreignKey: 'campaignId', as: 'kpis' });
KPI.belongsTo(Campaign, { foreignKey: 'campaignId' });

module.exports = KPI;
