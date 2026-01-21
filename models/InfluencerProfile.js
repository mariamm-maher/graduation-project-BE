const { DataTypes } = require('sequelize'); 
const sequelize = require('../config/db');

const InfluencerProfile = sequelize.define('InfluencerProfile', {
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

  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },

  // Social Media
  socialMediaLinks: {
    type: DataTypes.JSONB, // platform => url
    allowNull: true,
    defaultValue: {}
  },
  primaryPlatform: {
    type: DataTypes.STRING,
    allowNull: true
  },
  followersCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  engagementRate: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true,
    defaultValue: 0.0
  },

  // Content & Niches
  categories: {
    type: DataTypes.ARRAY(DataTypes.STRING), // ["Beauty", "Food", ...]
    allowNull: true
  },
  contentTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING), // ["Post", "Story", "Reel"]
    allowNull: true
  },
  collaborationTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING), // ["Sponsored post", "Review"]
    allowNull: true
  },

  // Audience
  audienceAgeRange: {
    type: DataTypes.STRING, // "18-24", "25-34"
    allowNull: true
  },
  audienceGender: {
    type: DataTypes.STRING, // "all", "male", "female"
    allowNull: true
  },
  audienceLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  interests: {
    type: DataTypes.ARRAY(DataTypes.STRING),
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
  }

}, {
  timestamps: true
});

module.exports = InfluencerProfile;
