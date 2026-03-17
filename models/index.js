const sequelize = require('../config/db');
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const OwnerProfile = require('./OwnerProfile');
const Brand = require('./Brand')
const InfluencerProfile = require('./InfluencerProfile');
const Campaign = require('./Campaign');
const KPI = require('./KPI');
const TargetAudience = require('./TargetAudience');
const ContentCalendar = require('./ContentCalendar');
const CampaignAIVersion = require('./CampaignAIVersion');
const Collaboration = require('./Collaboration');
const CollaborationRequest = require('./CollaborationRequest');
const CollaborationContract = require('./CollaborationContract');
const CollaborationTask = require('./CollaborationTask');
const ChatRoom = require('./ChatRoom');
const ChatParticipant = require('./ChatParticipant');
const Message = require('./Message');


const Session = require('./Session');
const Log = require('./Log');
//const SocialMediaAccount = require('./SocialMediaAccount');
const Notification = require('./Notification');
// UploadedFile model removed — using Cloudinary only (no local DB model)
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
Brand.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
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

// Campaign and KPI - One-to-Many
Campaign.hasMany(KPI, {
  foreignKey: 'campaignId',
  as: 'kpis',
  onDelete: 'CASCADE'
});

KPI.belongsTo(Campaign, {
  foreignKey: 'campaignId',
  as: 'campaign'
});

// Campaign and TargetAudience - One-to-One
Campaign.hasOne(TargetAudience, {
  foreignKey: 'campaignId',
  as: 'targetAudience',
  onDelete: 'CASCADE'
});

TargetAudience.belongsTo(Campaign, {
  foreignKey: 'campaignId',
  as: 'campaign'
});

// Campaign and ContentCalendar - One-to-Many
Campaign.hasMany(ContentCalendar, {
  foreignKey: 'campaignId',
  as: 'contentCalendar',
  onDelete: 'CASCADE'
});

ContentCalendar.belongsTo(Campaign, {
  foreignKey: 'campaignId',
  as: 'campaign'
});

// Campaign and CampaignAIVersion - One-to-Many
Campaign.hasMany(CampaignAIVersion, {
  foreignKey: 'campaignId',
  as: 'aiVersions',
  onDelete: 'CASCADE'
});

CampaignAIVersion.belongsTo(Campaign, {
  foreignKey: 'campaignId',
  as: 'campaign'
});

Campaign.hasMany(CollaborationRequest, {
  foreignKey: 'campaignId',
  as: 'collaborationRequests',
  onDelete: 'CASCADE'
});
CollaborationRequest.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

User.hasMany(CollaborationRequest, {
  foreignKey: 'ownerId',
  as: 'sentCollaborationRequests',
  onDelete: 'CASCADE'
});
CollaborationRequest.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(CollaborationRequest, {
  foreignKey: 'influencerId',
  as: 'receivedCollaborationRequests',
  onDelete: 'CASCADE'
});
CollaborationRequest.belongsTo(User, { foreignKey: 'influencerId', as: 'influencer' });


CollaborationRequest.hasOne(Collaboration, {
  foreignKey: 'collaborationRequestId',
  as: 'collaboration',
  onDelete: 'RESTRICT'
});
Collaboration.belongsTo(CollaborationRequest, {
  foreignKey: 'collaborationRequestId',
  as: 'request'
});

Campaign.hasMany(Collaboration, { foreignKey: 'campaignId', as: 'collaborations', onDelete: 'CASCADE' });
Collaboration.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

User.hasMany(Collaboration, { foreignKey: 'ownerId', as: 'ownerCollaborations', onDelete: 'CASCADE' });
Collaboration.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(Collaboration, { foreignKey: 'influencerId', as: 'influencerCollaborations', onDelete: 'CASCADE' });
Collaboration.belongsTo(User, { foreignKey: 'influencerId', as: 'influencer' });


Collaboration.hasOne(CollaborationContract, {
  foreignKey: 'collaborationId',
  as: 'contract',
  onDelete: 'CASCADE'
});
CollaborationContract.belongsTo(Collaboration, {
  foreignKey: 'collaborationId',
  as: 'collaboration'
});


Collaboration.hasMany(CollaborationTask, {
  foreignKey: 'collaborationId',
  as: 'tasks',
  onDelete: 'CASCADE'
});
CollaborationTask.belongsTo(Collaboration, {
  foreignKey: 'collaborationId',
  as: 'collaboration'
});

ChatRoom.belongsTo(Collaboration, {
  foreignKey: 'collaborationId',
  as: 'collaboration'
});

// ChatRoom and ChatParticipant - One-to-Many
ChatRoom.hasMany(ChatParticipant, {
  foreignKey: 'chatRoomId',
  as: 'participants',
  onDelete: 'CASCADE'
});

ChatParticipant.belongsTo(ChatRoom, {
  foreignKey: 'chatRoomId',
  as: 'chatRoom'
});

// User and ChatParticipant - One-to-Many
User.hasMany(ChatParticipant, {
  foreignKey: 'userId',
  as: 'chatParticipations',
  onDelete: 'CASCADE'
});

ChatParticipant.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// ChatRoom and Message - One-to-Many
ChatRoom.hasMany(Message, {
  foreignKey: 'chatRoomId',
  as: 'messages',
  onDelete: 'CASCADE'
});

Message.belongsTo(ChatRoom, {
  foreignKey: 'chatRoomId',
  as: 'chatRoom'
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

// User and Log - One-to-Many (actor relationship)
User.hasMany(Log, {
  foreignKey: 'actorId',
  as: 'logs',
  onDelete: 'SET NULL'
});

Log.belongsTo(User, {
  foreignKey: 'actorId',
  as: 'actorUser'
});

User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE'
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// UploadedFile associations removed
module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  OwnerProfile,
  Brand,
  InfluencerProfile,
  Campaign,
  KPI,
  TargetAudience,
  ContentCalendar,
  CampaignAIVersion,
  Collaboration,
  CollaborationRequest,
  CollaborationContract,
  CollaborationTask,
  ChatRoom,
  ChatParticipant,
  Message,
  Session,
  Notification,
  Log,
};