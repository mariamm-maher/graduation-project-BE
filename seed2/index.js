/**
 * Enterprise Seed Data Generator
 * 
 * This script generates comprehensive, realistic seed data for the entire database.
 * 
 * Features:
 * - Transaction-safe seeding (all or nothing)
 * - Realistic data with proper relationships
 * - Validation before insertion
 * - Progress logging
 * - Idempotent (safe to re-run)
 * 
 * Usage:
 *   node seed2/index.js
 * 
 * Environment Variables:
 *   SEED_TRUNCATE=true  - Clear existing data before seeding (DANGEROUS)
 *   SEED_VERBOSE=true   - Extra detailed logging
 *   SEED_COUNT=low|medium|high  - Data volume (default: medium)
 */

require('dotenv').config();
const sequelize = require('../config/db');
const models = require('../models');

// Utilities
const idTracker = require('./utils/id-tracker');
const logger = require('./utils/progress-logger');
const { Validators, ENUMS } = require('./utils/validators');

// Factories
const userFactory = require('./factories/user-factory');
const profileFactory = require('./factories/profile-factory');
const campaignFactory = require('./factories/campaign-factory');
const collaborationFactory = require('./factories/collaboration-factory');
const chatFactory = require('./factories/chat-factory');
const notificationFactory = require('./factories/notification-factory');
const reviewFactory = require('./factories/review-factory');
const brandFactory = require('./factories/brand-factory');
const socialFactory = require('./factories/social-factory');

// Configuration based on SEED_COUNT environment variable
const CONFIG = {
  low: {
    owners: 3,
    influencers: 4,
    admins: 1,
    campaignsPerOwner: 2,
    collaborations: 5,
    messagesPerChat: 8,
    notificationsPerUser: 4
  },
  medium: {
    owners: 8,
    influencers: 12,
    admins: 2,
    campaignsPerOwner: 4,
    collaborations: 15,
    messagesPerChat: 15,
    notificationsPerUser: 8
  },
  high: {
    owners: 15,
    influencers: 25,
    admins: 3,
    campaignsPerOwner: 6,
    collaborations: 30,
    messagesPerChat: 25,
    notificationsPerUser: 12
  }
};

const SEED_COUNT = process.env.SEED_COUNT || 'medium';
const COUNT = CONFIG[SEED_COUNT] || CONFIG.medium;
const VERBOSE = process.env.SEED_VERBOSE === 'true';

/**
 * Main seeding function
 */
async function runSeeds() {
  logger.start();
  
  const transaction = await sequelize.transaction();
  
  try {
    // ==========================================
    // PHASE 1: Core Entities (No dependencies)
    // ==========================================
    
    logger.section('Phase 1: Core Entities');
    
    // Create Roles
    const roles = await seedRoles(transaction);
    
    // Create Users
    const users = await seedUsers(transaction);
    
    // Create UserRoles
    await seedUserRoles(transaction, users, roles);
    
    // ==========================================
    // PHASE 2: Profile Data (Depends on Users)
    // ==========================================
    
    logger.section('Phase 2: Profile Data');
    
    const ownerUsers = users.filter(u => u._role === 'OWNER');
    const influencerUsers = users.filter(u => u._role === 'INFLUENCER');
    const adminUsers = users.filter(u => u._role === 'ADMIN');
    
    await seedProfiles(transaction, ownerUsers, influencerUsers);
    await seedBrands(transaction, ownerUsers);
    
    // ==========================================
    // PHASE 3: Campaign Data (Depends on Users)
    // ==========================================
    
    logger.section('Phase 3: Campaigns');
    
    const campaigns = await seedCampaigns(transaction, ownerUsers);
    
    // ==========================================
    // PHASE 4: Social Data (Depends on Influencers)
    // ==========================================
    
    logger.section('Phase 4: Social Data');
    
    await seedSocialChannels(transaction, influencerUsers);
    
    // ==========================================
    // PHASE 5: Collaboration Data (Depends on Campaigns, Users)
    // ==========================================
    
    logger.section('Phase 5: Collaborations');
    
    const { collaborationRecords, tasks } = await seedCollaborations(
      transaction, 
      campaigns, 
      ownerUsers, 
      influencerUsers
    );
    
    // ==========================================
    // PHASE 6: Communication Data (Depends on Collaborations, Users)
    // ==========================================
    
    logger.section('Phase 6: Communication');
    
    await seedChatData(transaction, collaborationRecords, ownerUsers, influencerUsers);
    await seedNotifications(transaction, users);
    
    // ==========================================
    // PHASE 7: Reviews (Depends on Completed Collaborations)
    // ==========================================
    
    logger.section('Phase 7: Reviews');
    
    await seedReviews(transaction, collaborationRecords, ownerUsers, influencerUsers);
    
    // ==========================================
    // PHASE 8: Additional Data
    // ==========================================
    
    logger.section('Phase 8: Interest Messages');
    
    await seedInterestMessages(transaction, campaigns, ownerUsers, influencerUsers);
    
    // Commit transaction
    await transaction.commit();
    
    logger.success('All seed data committed successfully!');
    logger.summary();
    
    // Print distribution summary
    printDistributionSummary(users, campaigns, collaborationRecords, tasks);
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Seeding failed - transaction rolled back', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// ==========================================
// SEEDING FUNCTIONS
// ==========================================

async function seedRoles(transaction) {
  logger.info('Creating roles...');
  
  const roleData = userFactory.constructor.generateRoles();
  const createdRoles = [];
  
  for (const role of roleData) {
    const [instance, created] = await models.Role.findOrCreate({
      where: { name: role.name },
      defaults: role,
      transaction
    });
    
    createdRoles.push(instance);
    logger.track('Role', created ? 'created' : 'skipped');
    
    if (VERBOSE) {
      logger[created ? 'created' : 'skipped']('Role', role.name);
    }
  }
  
  logger.success(`Roles: ${createdRoles.length} total`);
  return createdRoles;
}

async function seedUsers(transaction) {
  logger.info('Creating ONLY demo owner and demo influencer...');

  const allUsers = [];

  // Create ONLY Demo Owner
  const demoOwnerData = {
    firstName: 'Demo',
    lastName: 'Owner',
    email: 'demo.owner@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0001',
    isEmailVerified: true,
    isActive: true,
  };
  const [ownerUser, ownerCreated] = await models.User.findOrCreate({
    where: { email: demoOwnerData.email },
    defaults: demoOwnerData,
    transaction
  });
  ownerUser._role = 'OWNER';
  allUsers.push(ownerUser);
  if (ownerCreated) {
    logger.created('User', ownerUser.email, 'DEMO OWNER');
  } else {
    logger.skipped('User', ownerUser.email);
  }

  // Create ONLY Demo Influencer
  const demoInfluencerData = {
    firstName: 'Demo',
    lastName: 'Influencer',
    email: 'demo.influencer@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0002',
    isEmailVerified: true,
    isActive: true,
  };
  const [influencerUser, influencerCreated] = await models.User.findOrCreate({
    where: { email: demoInfluencerData.email },
    defaults: demoInfluencerData,
    transaction
  });
  influencerUser._role = 'INFLUENCER';
  allUsers.push(influencerUser);
  if (influencerCreated) {
    logger.created('User', influencerUser.email, 'DEMO INFLUENCER');
  } else {
    logger.skipped('User', influencerUser.email);
  }

  logger.success(`Users: ${allUsers.length} total (1 demo owner, 1 demo influencer)`);
  return allUsers;
}

async function seedUserRoles(transaction, users, roles) {
  logger.info('Assigning user roles...');
  
  const roleMap = {};
  for (const role of roles) {
    roleMap[role.name] = role.id;
  }
  
  for (const user of users) {
    if (!user._role) continue;
    
    const roleId = roleMap[user._role];
    if (!roleId) continue;
    
    await models.UserRole.findOrCreate({
      where: { userId: user.id, roleId },
      defaults: { userId: user.id, roleId },
      transaction
    });
  }
  
  logger.success('User roles assigned');
}

async function seedProfiles(transaction, owners, influencers) {
  logger.info('Creating profiles...');
  
  // Owner profiles
  for (const user of owners) {
    const [profile, created] = await models.OwnerProfile.findOrCreate({
      where: { userId: user.id },
      defaults: profileFactory.generateOwnerProfile(user.id, { 
        completionLevel: Math.random() > 0.3 ? 'complete' : 'onboarded'
      }),
      transaction
    });
    logger.track('OwnerProfile', created ? 'created' : 'skipped');
  }
  
  // Influencer profiles
  for (const user of influencers) {
    const [profile, created] = await models.InfluencerProfile.findOrCreate({
      where: { userId: user.id },
      defaults: profileFactory.generateInfluencerProfile(user.id, { 
        completionLevel: Math.random() > 0.3 ? 'complete' : 'onboarded'
      }),
      transaction
    });
    logger.track('InfluencerProfile', created ? 'created' : 'skipped');
  }
  
  logger.success(`Profiles: ${owners.length} owners, ${influencers.length} influencers`);
}

async function seedBrands(transaction, owners) {
  logger.info('Creating brands...');
  
  for (const owner of owners) {
    // 1-3 brands per owner
    const brandCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < brandCount; i++) {
      const brandData = brandFactory.generateBrand(owner.id);
      
      const [brand, created] = await models.Brand.findOrCreate({
        where: { name: brandData.name },
        defaults: brandData,
        transaction
      });
      
      if (created) {
        idTracker.set('Brand', `${owner.id}_${i}`, brand.id);
        logger.created('Brand', brand.name);
      }
      logger.track('Brand', created ? 'created' : 'skipped');
    }
  }
  
  logger.success('Brands created');
}

async function seedCampaigns(transaction, owners) {
  logger.info(`Creating ~${COUNT.campaignsPerOwner} campaigns per owner...`);
  
  const allCampaigns = [];
  
  for (const owner of owners) {
    // Get a brand for this owner to use in campaign naming
    const ownerBrands = await models.Brand.findAll({ 
      where: { ownerId: owner.id },
      transaction 
    });
    const brandName = ownerBrands[0]?.name || generateBrandName();
    
    for (let i = 0; i < COUNT.campaignsPerOwner; i++) {
      const campaignPackage = campaignFactory.generateCompleteCampaign(owner.id, {
        brandName,
        lifecycleStage: pick(['saved', 'saved', 'saved', 'completed', 'ai_generated', 'draft'])
      });
      
      // Create Campaign
      const [campaign, created] = await models.Campaign.findOrCreate({
        where: { 
          userId: owner.id,
          campaignName: campaignPackage.campaign.campaignName
        },
        defaults: campaignPackage.campaign,
        transaction
      });
      
      if (created) {
        allCampaigns.push(campaign);
        logger.created('Campaign', campaign.campaignName, `Goal: ${campaign.campaign_goal}`);
        
        // Create TargetAudience
        await models.TargetAudience.create({
          ...campaignPackage.targetAudience,
          campaignId: campaign.id
        }, { transaction });
        
        // Create KPIs
        await models.KPI.bulkCreate(
          campaignPackage.kpis.map(kpi => ({ ...kpi, campaignId: campaign.id })),
          { transaction }
        );
        
        // Create ContentCalendar
        if (campaignPackage.contentCalendar.length > 0) {
          await models.ContentCalendar.bulkCreate(
            campaignPackage.contentCalendar.map(item => ({ ...item, campaignId: campaign.id })),
            { transaction }
          );
        }
        
        // Create CampaignAIVersion
        await models.CampaignAIVersion.create({
          ...campaignPackage.aiVersion,
          campaignId: campaign.id
        }, { transaction });
      }
      
      logger.track('Campaign', created ? 'created' : 'skipped');
    }
  }
  
  logger.success(`Campaigns: ${allCampaigns.length} total`);
  return allCampaigns;
}

async function seedSocialChannels(transaction, influencers) {
  logger.info('Creating social channels...');
  
  for (const influencer of influencers) {
    // 2-4 channels per influencer
    const channelCount = Math.floor(Math.random() * 3) + 2;
    const channels = socialFactory.generateChannelsForUser(influencer.id, channelCount);
    
    for (const channelData of channels) {
      const [channel, created] = await models.Channel.findOrCreate({
        where: { 
          userId: influencer.id,
          platform: channelData.platform
        },
        defaults: channelData,
        transaction
      });
      
      logger.track('Channel', created ? 'created' : 'skipped');
    }
  }
  
  logger.success('Social channels created');
}

async function seedCollaborations(transaction, campaigns, owners, influencers) {
  logger.info(`Creating ${COUNT.collaborations} collaborations...`);
  
  const collaborationRecords = [];
  const allTasks = [];
  
  // Filter to published campaigns for collaborations
  const activeCampaigns = campaigns.filter(c => c.isPublished);
  
  for (let i = 0; i < COUNT.collaborations; i++) {
    const campaign = activeCampaigns[i % activeCampaigns.length];
    const owner = owners.find(o => o.id === campaign.userId) || pick(owners);
    const influencer = pick(influencers);
    
    // Generate collaboration workflow
    const workflow = collaborationFactory.generateCompleteCollaboration(
      campaign.id,
      owner.id,
      influencer.id,
      {
        requestStatus: pick(['pending', 'pending', 'accepted', 'negotiating', 'rejected']),
        collaborationStatus: pick(['in_progress', 'in_progress', 'completed', 'live'])
      }
    );
    
    // Create CollaborationRequest
    const [request] = await models.CollaborationRequest.findOrCreate({
      where: {
        campaignId: campaign.id,
        ownerId: owner.id,
        influencerId: influencer.id
      },
      defaults: workflow.request,
      transaction
    });
    
    // If accepted, create Collaboration and related data
    if (workflow.collaboration && request.status === 'accepted') {
      workflow.collaboration.collaborationRequestId = request.id;
      
      const [collab, created] = await models.Collaboration.findOrCreate({
        where: { collaborationRequestId: request.id },
        defaults: workflow.collaboration,
        transaction
      });
      
      if (created) {
        collaborationRecords.push(collab);
        logger.created('Collaboration', collab.id, `Status: ${collab.status}`);
        
        // Create Contract
        if (workflow.contract) {
          workflow.contract.collaborationId = collab.id;
          await models.CollaborationContract.create(workflow.contract, { transaction });
        }
        
        // Create Tasks
        if (workflow.tasks.length > 0) {
          const tasksWithCollabId = workflow.tasks.map(t => ({ ...t, collaborationId: collab.id }));
          await models.CollaborationTask.bulkCreate(tasksWithCollabId, { transaction });
          allTasks.push(...tasksWithCollabId);
        }
      }
      
      logger.track('Collaboration', created ? 'created' : 'skipped');
    }
  }
  
  logger.success(`Collaborations: ${collaborationRecords.length}, Tasks: ${allTasks.length}`);
  return { collaborationRecords, tasks: allTasks };
}

async function seedChatData(transaction, collaborations, owners, influencers) {
  logger.info('Creating chat rooms and messages...');
  
  for (const collab of collaborations) {
    const chatData = chatFactory.generateCompleteChat(
      collab.id,
      collab.ownerId,
      collab.influencerId,
      { messageCount: COUNT.messagesPerChat }
    );
    
    // Create ChatRoom
    const [room] = await models.ChatRoom.findOrCreate({
      where: { collaborationId: collab.id },
      defaults: chatData.room,
      transaction
    });
    
    // Create Participants
    for (const participant of chatData.participants) {
      await models.ChatParticipant.findOrCreate({
        where: { chatRoomId: room.id, userId: participant.userId },
        defaults: { ...participant, chatRoomId: room.id },
        transaction
      });
    }
    
    // Create Messages
    const messagesWithRoomId = chatData.messages.map(m => ({ ...m, chatRoomId: room.id }));
    await models.Message.bulkCreate(messagesWithRoomId, { transaction });
    
    logger.track('ChatRoom', 'created');
    logger.track('Message', 'created');
  }
  
  logger.success('Chat data created');
}

async function seedNotifications(transaction, users) {
  logger.info('Creating notifications...');
  
  for (const user of users) {
    const notifications = notificationFactory.generateRandomNotifications(
      user.id, 
      COUNT.notificationsPerUser
    );
    
    for (const notification of notifications) {
      await models.Notification.create(notification, { transaction });
      logger.track('Notification', 'created');
    }
  }
  
  logger.success('Notifications created');
}

async function seedReviews(transaction, collaborations, owners, influencers) {
  logger.info('Creating reviews...');
  
  const completedCollabs = collaborations.filter(c => c.status === 'completed');
  
  for (const collab of completedCollabs) {
    // 70% of completed collaborations have reviews
    if (Math.random() > 0.3) {
      const reviews = reviewFactory.generateReviewExchange(
        collab.ownerId,
        collab.influencerId,
        collab.id
      );
      
      for (const review of reviews) {
        await models.Review.create(review, { transaction });
        logger.track('Review', 'created');
      }
    }
  }
  
  logger.success('Reviews created');
}

async function seedInterestMessages(transaction, campaigns, owners, influencers) {
  logger.info('Creating interest messages...');
  
  // Create some interest messages (influencers reaching out to owners)
  for (let i = 0; i < Math.min(10, campaigns.length); i++) {
    const campaign = campaigns[i];
    const owner = owners.find(o => o.id === campaign.userId);
    const influencer = pick(influencers);
    
    if (!owner || !influencer) continue;
    
    await models.InterestMessage.create({
      campaignId: campaign.id,
      ownerId: owner.id,
      influencerId: influencer.id,
      message: `Hi! I'm interested in collaborating on "${campaign.campaignName}". My audience aligns perfectly with your target demographic.`,
      isRead: Math.random() > 0.5,
      readAt: Math.random() > 0.5 ? new Date() : null
    }, { transaction });
    
    logger.track('InterestMessage', 'created');
  }
  
  logger.success('Interest messages created');
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function printDistributionSummary(users, campaigns, collaborations, tasks) {
  console.log('\n📊 Data Distribution Summary:\n');
  
  const owners = users.filter(u => u._role === 'OWNER');
  const influencers = users.filter(u => u._role === 'INFLUENCER');
  const admins = users.filter(u => u._role === 'ADMIN');
  
  console.log(`  Users: ${users.length} (${owners.length} owners, ${influencers.length} influencers, ${admins.length} admins)`);
  console.log(`  Campaigns: ${campaigns.length}`);
  console.log(`  Collaborations: ${collaborations.length}`);
  console.log(`  Tasks: ${tasks.length}`);
  
  // Status breakdowns
  const lifecycleStages = {};
  campaigns.forEach(c => {
    lifecycleStages[c.lifecycleStage] = (lifecycleStages[c.lifecycleStage] || 0) + 1;
  });
  console.log(`\n  Campaign Lifecycle Stages:`);
  Object.entries(lifecycleStages).forEach(([stage, count]) => {
    console.log(`    - ${stage}: ${count}`);
  });
  
  const collabStatuses = {};
  collaborations.forEach(c => {
    collabStatuses[c.status] = (collabStatuses[c.status] || 0) + 1;
  });
  console.log(`\n  Collaboration Statuses:`);
  Object.entries(collabStatuses).forEach(([status, count]) => {
    console.log(`    - ${status}: ${count}`);
  });
  
  const taskStatuses = {};
  tasks.forEach(t => {
    taskStatuses[t.status] = (taskStatuses[t.status] || 0) + 1;
  });
  console.log(`\n  Task Statuses:`);
  Object.entries(taskStatuses).forEach(([status, count]) => {
    console.log(`    - ${status}: ${count}`);
  });
  
  console.log('\n✨ Seed generation complete!\n');
}

// ==========================================
// ENTRY POINT
// ==========================================

if (require.main === module) {
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Seeding interrupted by user');
    process.exit(0);
  });
  
  // Run seeds
  runSeeds().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runSeeds, CONFIG };
