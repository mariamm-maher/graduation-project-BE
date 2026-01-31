const sequelize = require('../config/db');
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const OwnerProfile = require('./OwnerProfile');
const InfluencerProfile = require('./InfluencerProfile');
const Campaign = require('./Campaign');
const Collaboration = require('./Collaboration');
const CollaborationRequest = require('./CollaborationRequest');
const CollaborationContract = require('./CollaborationContract');
const CollaborationBoard = require('./CollaborationBoard');
const CollaborationTask = require('./CollaborationTask');
const ChatRoom = require('./ChatRoom');
const ChatParticipant = require('./ChatParticipant');
const Message = require('./Message');
const Session = require('./Session');
const Log = require('./Log');
const ServiceListing = require('./ServiceListing');
const ServiceRequest = require('./ServiceRequest');
const Offer = require('./Offer');
const Proposal = require('./Proposal');

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

// Campaign and CollaborationRequest - One-to-Many
Campaign.hasMany(CollaborationRequest, {
  foreignKey: 'campaignId',
  as: 'collaborationRequests',
  onDelete: 'CASCADE'
});

CollaborationRequest.belongsTo(Campaign, {
  foreignKey: 'campaignId',
  as: 'campaign'
});

// User (Influencer) and CollaborationRequest - One-to-Many
User.hasMany(CollaborationRequest, {
  foreignKey: 'influencerId',
  as: 'collaborationRequests',
  onDelete: 'CASCADE'
});

CollaborationRequest.belongsTo(User, {
  foreignKey: 'influencerId',
  as: 'influencer'
});

// CollaborationRequest and CollaborationContract - One-to-Many
CollaborationRequest.hasMany(CollaborationContract, {
  foreignKey: 'collaborationRequestId',
  as: 'contracts',
  onDelete: 'CASCADE'
});

CollaborationContract.belongsTo(CollaborationRequest, {
  foreignKey: 'collaborationRequestId',
  as: 'request'
});

// CollaborationContract and Collaboration - One-to-One
CollaborationContract.hasOne(Collaboration, {
  foreignKey: 'contractId',
  as: 'collaboration',
  onDelete: 'SET NULL'
});

Collaboration.belongsTo(CollaborationContract, {
  foreignKey: 'contractId',
  as: 'contract'
});

// Collaboration and CollaborationBoard - One-to-Many
Collaboration.hasMany(CollaborationBoard, {
  foreignKey: 'collaborationId',
  as: 'boards',
  onDelete: 'CASCADE'
});

CollaborationBoard.belongsTo(Collaboration, {
  foreignKey: 'collaborationId',
  as: 'collaboration'
});

// CollaborationBoard and CollaborationTask - One-to-Many
CollaborationBoard.hasMany(CollaborationTask, {
  foreignKey: 'boardId',
  as: 'tasks',
  onDelete: 'CASCADE'
});

CollaborationTask.belongsTo(CollaborationBoard, {
  foreignKey: 'boardId',
  as: 'board'
});

// User and CollaborationTask - One-to-Many (assigned tasks)
User.hasMany(CollaborationTask, {
  foreignKey: 'assignedTo',
  as: 'assignedTasks',
  onDelete: 'SET NULL'
});

CollaborationTask.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee'
});

// Collaboration and ChatRoom - One-to-One (optional)
Collaboration.hasOne(ChatRoom, {
  foreignKey: 'collaborationId',
  as: 'chatRoom',
  onDelete: 'SET NULL'
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

// User (Influencer) and ServiceListing - One-to-Many
User.hasMany(ServiceListing, {
  foreignKey: 'influencerId',
  as: 'serviceListings',
  onDelete: 'CASCADE'
});

ServiceListing.belongsTo(User, {
  foreignKey: 'influencerId',
  as: 'influencer'
});

// User (Owner) and ServiceRequest - One-to-Many
User.hasMany(ServiceRequest, {
  foreignKey: 'ownerId',
  as: 'serviceRequests',
  onDelete: 'CASCADE'
});

ServiceRequest.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

// ServiceListing and Offer - One-to-Many
ServiceListing.hasMany(Offer, {
  foreignKey: 'serviceListingId',
  as: 'offers',
  onDelete: 'CASCADE'
});

Offer.belongsTo(ServiceListing, {
  foreignKey: 'serviceListingId',
  as: 'serviceListing'
});

// User (Owner) and Offer - One-to-Many
User.hasMany(Offer, {
  foreignKey: 'ownerId',
  as: 'madeOffers',
  onDelete: 'CASCADE'
});

Offer.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

// ServiceRequest and Proposal - One-to-Many
ServiceRequest.hasMany(Proposal, {
  foreignKey: 'serviceRequestId',
  as: 'proposals',
  onDelete: 'CASCADE'
});

Proposal.belongsTo(ServiceRequest, {
  foreignKey: 'serviceRequestId',
  as: 'serviceRequest'
});

// User (Influencer) and Proposal - One-to-Many
User.hasMany(Proposal, {
  foreignKey: 'influencerId',
  as: 'madeProposals',
  onDelete: 'CASCADE'
});

Proposal.belongsTo(User, {
  foreignKey: 'influencerId',
  as: 'influencer'
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
  CollaborationRequest,
  CollaborationContract,
  CollaborationBoard,
  CollaborationTask,
  ChatRoom,
  ChatParticipant,
  Message,
  Session,
  ServiceListing,
  ServiceRequest,
  Offer,
  Proposal
  ,
  Log
};