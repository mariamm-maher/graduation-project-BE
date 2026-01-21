const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Campaign = require('./Campaign');

const TargetAudience = sequelize.define('TargetAudience', {
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
  ageRange: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('all', 'male', 'female', 'custom'),
    allowNull: false
  },
  interests: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  },
  platformsUsed: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  }
}, {
  timestamps: false
});

Campaign.hasOne(TargetAudience, { foreignKey: 'campaignId', as: 'targetAudience' });
TargetAudience.belongsTo(Campaign, { foreignKey: 'campaignId' });

module.exports = TargetAudience;
