const sequelize = require('../config/db');
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const OwnerProfile = require('./OwnerProfile');
const InfluencerProfile = require('./InfluencerProfile');
const Campaign = require('./Campaign');
const Collaboration = require('./Collaboration');
const Chat = require('./Chat');
const Message = require('./Message');
const Session = require('./Session');

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

// Chat and User (Owner) - One-to-Many
User.hasMany(Chat, {
  foreignKey: 'userId',
  as: 'userChats',
  onDelete: 'CASCADE'
});

Chat.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Chat and User (Other User) - One-to-Many
User.hasMany(Chat, {
  foreignKey: 'otherUserId',
  as: 'otherUserChats',
  onDelete: 'CASCADE'
});

Chat.belongsTo(User, {
  foreignKey: 'otherUserId',
  as: 'otherUser'
});

// Campaign and Chat - One-to-Many (optional relationship)
// Campaign.hasMany(Chat, {
//   foreignKey: 'campaignId',
//   as: 'chats',
//   onDelete: 'SET NULL'
// });

Chat.belongsTo(Campaign, {
  foreignKey: 'campaignId',
  as: 'campaign'
});

// Chat and Message - One-to-Many
Chat.hasMany(Message, {
  foreignKey: 'chatId',
  as: 'messages',
  onDelete: 'CASCADE'
});

Message.belongsTo(Chat, {
  foreignKey: 'chatId',
  as: 'chat'
});

// User and Message - One-to-Many (sender relationship)
User.hasMany(Message, {
  foreignKey: 'senderId',
  as: 'sentMessages',
  onDelete: 'CASCADE'
});

Message.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender'
});

// User and Session - One-to-Many
User.hasMany(Session, {
  foreignKey: 'userId',
  as: 'sessions',
  onDelete: 'CASCADE'
});

Session.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  OwnerProfile,
  InfluencerProfile,
  Campaign,
  Collaboration,
  Chat,
  Message,
  Session
};