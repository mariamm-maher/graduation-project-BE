const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OwnerProfile = sequelize.define('OwnerProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },

  // Basic Info
  brand_name: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  unique_selling_point: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  product_or_service: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_size: {
    type: DataTypes.ENUM('Solo', 'Small', 'Mid', 'Enterprise'),
    allowNull: true,
    validate: {
      isIn: [['Solo', 'Small', 'Mid', 'Enterprise']]
    }
  },
  target_market: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  competitors: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  has_previous_campaigns: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  previous_campaign_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    // validate: { isUrl: true }
  },
  // Marketing Info
  platforms: {
    type: DataTypes.ARRAY(DataTypes.STRING), // ["Instagram", "Facebook", ...]
    allowNull: true
  },
    targetAudience: {
    type: DataTypes.JSONB, // {ageRange: "18-24", gender: "all", location: "Egypt"}
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },



 


  // Analytics / Admin Fields
  completionPercentage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isOnboarded: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }

}, {
  timestamps: true
});



module.exports = OwnerProfile;
