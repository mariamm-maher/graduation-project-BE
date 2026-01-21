const sequelize = require('../config/db');
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const OwnerProfile = require('./OwnerProfile');
const InfluencerProfile = require('./InfluencerProfile');
const Campaign = require('./Campaign');
const Collaboration = require('./Collaboration');

// Define relationships

// User and Role - Many-to-Many
User.belongsToMany(Role, { 
  through: UserRole, 
  foreignKey: 'userId',
  as: 'roles'
});

Role.belongsToMany(User, { 
  through: UserRole, 
  foreignKey: 'roleId',
  as: 'users'
});

// User and OwnerProfile - One-to-One
User.hasOne(OwnerProfile, {
  foreignKey: 'userId',
  as: 'ownerProfile',
  onDelete: 'CASCADE'
});

OwnerProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User and InfluencerProfile - One-to-One
User.hasOne(InfluencerProfile, {
  foreignKey: 'userId',
  as: 'influencerProfile',
  onDelete: 'CASCADE'
});

InfluencerProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User and Campaign - One-to-Many
User.hasMany(Campaign, {
  foreignKey: 'userId',
  as: 'campaigns',
  onDelete: 'CASCADE'
});

Campaign.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Campaign and Collaboration - One-to-Many
Campaign.hasMany(Collaboration, {
  foreignKey: 'campaignId',
  as: 'collaborations',
  onDelete: 'CASCADE'
});

Collaboration.belongsTo(Campaign, {
  foreignKey: 'campaignId',
  as: 'campaign'
});

// User (Influencer) and Collaboration - One-to-Many
User.hasMany(Collaboration, {
  foreignKey: 'influencerId',
  as: 'influencerCollaborations',
  onDelete: 'CASCADE'
});

Collaboration.belongsTo(User, {
  foreignKey: 'influencerId',
  as: 'influencer'
});

// User (Owner) and Collaboration - One-to-Many
User.hasMany(Collaboration, {
  foreignKey: 'ownerId',
  as: 'ownerCollaborations',
  onDelete: 'CASCADE'
});

Collaboration.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  OwnerProfile,
  InfluencerProfile,
  Campaign,
  Collaboration
};