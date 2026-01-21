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
  businessName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  businessType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isUrl: true }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // Marketing Info
  platformsUsed: {
    type: DataTypes.ARRAY(DataTypes.STRING), // ["Instagram", "Facebook", ...]
    allowNull: true
  },
  primaryMarketingGoal: {
    type: DataTypes.STRING, // e.g., awareness, lead generation, conversion
    allowNull: true
  },
  targetAudience: {
    type: DataTypes.JSONB, // {ageRange: "18-24", gender: "all", location: "Egypt"}
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
