const sequelize = require('../config/db');
const {
  User,
  Role,
  InfluencerProfile,
  OwnerProfile,
  Campaign,
  TargetAudience,
  KPI,
  ContentCalendar,
  CampaignAIVersion,
  CollaborationRequest,
  Collaboration,
  CollaborationContract,
  CollaborationTask,
  ChatRoom,
  ChatParticipant,
  Message,
  Notification,
  Review,
  PostAnalytics
} = require('../models');
const influencerAccounts = require('./influencer/data');
const ownerAccounts = require('./owner/data');
const campaignSeeds = require('./compagins/data');
const collaborationSeeds = require('./collaboration/data');
const taskSeeds = require('./tasks/data');
const messageSeeds = require('./messages/data');
const notificationSeeds = require('./notifications/data');
const reviewSeeds = require('./reviews/data');
const { seedTrackingCampaigns } = require('./tracking/seed');

async function ensureRole(user, role) {
  const roles = await user.getRoles({ where: { id: role.id } });
  if (!roles.length) {
    await user.addRole(role);
  }
}

async function seedInfluencers() {
  console.log('Seeding influencers...');
  const [influencerRole] = await Role.findOrCreate({
    where: { name: 'INFLUENCER' }
  });

  for (const account of influencerAccounts) {
    const [user, userCreated] = await User.findOrCreate({
      where: { email: account.user.email },
      defaults: account.user
    });

    await ensureRole(user, influencerRole);

    const [profile, profileCreated] = await InfluencerProfile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        ...account.profile
      }
    });

    if (!profileCreated) {
      await profile.update(account.profile);
    }

    console.log(
      `${userCreated ? 'CREATED' : 'EXISTS'} influencer user ${user.email} | ${profileCreated ? 'CREATED' : 'UPDATED'} profile`
    );
  }
  console.log(`Seeded ${influencerAccounts.length} influencer accounts.`);
}

async function seedOwners() {
  console.log('Seeding owners...');
  const [ownerRole] = await Role.findOrCreate({
    where: { name: 'OWNER' }
  });

  for (const account of ownerAccounts) {
    const [user, userCreated] = await User.findOrCreate({
      where: { email: account.user.email },
      defaults: account.user
    });

    await ensureRole(user, ownerRole);

    const [profile, profileCreated] = await OwnerProfile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        ...account.profile
      }
    });

    if (!profileCreated) {
      await profile.update(account.profile);
    }

    console.log(
      `${userCreated ? 'CREATED' : 'EXISTS'} owner user ${user.email} | ${profileCreated ? 'CREATED' : 'UPDATED'} profile`
    );
  }
  console.log(`Seeded ${ownerAccounts.length} owner accounts.`);
}

async function seedCampaigns() {
  console.log('Seeding campaigns...');

  for (const seed of campaignSeeds) {
    const owner = await User.findOne({ where: { email: seed.ownerEmail } });
    if (!owner) {
      console.log(`SKIPPED campaign "${seed.campaign.campaignName}": owner ${seed.ownerEmail} not found`);
      continue;
    }

    const [campaign, campaignCreated] = await Campaign.findOrCreate({
      where: {
        userId: owner.id,
        campaignName: seed.campaign.campaignName
      },
      defaults: {
        userId: owner.id,
        ...seed.campaign
      }
    });

    if (!campaignCreated) {
      await campaign.update(seed.campaign);
    }

    if (seed.targetAudience) {
      const [audience, audienceCreated] = await TargetAudience.findOrCreate({
        where: { campaignId: campaign.id },
        defaults: {
          campaignId: campaign.id,
          ...seed.targetAudience
        }
      });

      if (!audienceCreated) {
        await audience.update(seed.targetAudience);
      }
    }

    await KPI.destroy({ where: { campaignId: campaign.id } });
    if (Array.isArray(seed.kpis) && seed.kpis.length) {
      await KPI.bulkCreate(
        seed.kpis.map((item) => ({
          campaignId: campaign.id,
          metric: item.metric,
          targetValue: item.targetValue
        }))
      );
    }

    await ContentCalendar.destroy({ where: { campaignId: campaign.id } });
    if (Array.isArray(seed.contentCalendar) && seed.contentCalendar.length) {
      await ContentCalendar.bulkCreate(
        seed.contentCalendar.map((item) => ({
          campaignId: campaign.id,
          day: item.day,
          date: item.date,
          platform: item.platform,
          contentType: item.contentType,
          caption: item.caption,
          mediaUrl: item.mediaUrl,
          task: item.task,
          status: item.status
        }))
      );
    }

    await CampaignAIVersion.destroy({ where: { campaignId: campaign.id } });
    if (seed.aiVersion) {
      await CampaignAIVersion.create({
        campaignId: campaign.id,
        versionNumber: seed.aiVersion.versionNumber || 1,
        strategy: seed.aiVersion.strategy || null,
        execution: seed.aiVersion.execution || null,
        estimations: seed.aiVersion.estimations || null,
        isActive: seed.aiVersion.isActive !== undefined ? seed.aiVersion.isActive : true
      });
    }

    console.log(
      `${campaignCreated ? 'CREATED' : 'UPDATED'} campaign "${campaign.campaignName}" for ${seed.ownerEmail}`
    );
  }

  console.log(`Seeded ${campaignSeeds.length} campaigns.`);
}

async function seedCollaborations() {
  console.log('Seeding collaboration pipeline records...');

  const firstOwnerEmail = ownerAccounts[0]?.user?.email;
  const firstInfluencerEmail = influencerAccounts[0]?.user?.email;

  if (!firstOwnerEmail || !firstInfluencerEmail) {
    console.log('SKIPPED collaboration seeds: missing first owner or influencer seed account.');
    return;
  }

  const owner = await User.findOne({ where: { email: firstOwnerEmail } });
  const influencer = await User.findOne({ where: { email: firstInfluencerEmail } });

  if (!owner || !influencer) {
    console.log('SKIPPED collaboration seeds: owner/influencer user records not found in DB.');
    return;
  }

  for (const seed of collaborationSeeds) {
    const [campaign] = await Campaign.findOrCreate({
      where: {
        userId: owner.id,
        campaignName: seed.campaign.campaignName
      },
      defaults: {
        userId: owner.id,
        ...seed.campaign
      }
    });

    await campaign.update(seed.campaign);

    const requestWhere = {
      campaignId: campaign.id,
      ownerId: owner.id,
      influencerId: influencer.id,
      message: seed.request.message
    };

    const [request] = await CollaborationRequest.findOrCreate({
      where: requestWhere,
      defaults: {
        ...requestWhere,
        status: seed.request.status,
        proposedBudget: seed.request.proposedBudget,
        counterPrice: seed.request.counterPrice || null,
        responseMessage: seed.request.responseMessage || null,
        expiresAt: seed.request.expiresAt || null
      }
    });

    await request.update({
      status: seed.request.status,
      proposedBudget: seed.request.proposedBudget,
      counterPrice: seed.request.counterPrice || null,
      responseMessage: seed.request.responseMessage || null,
      expiresAt: seed.request.expiresAt || null
    });

    let collaboration = null;

    if (seed.collaboration) {
      const [collab] = await Collaboration.findOrCreate({
        where: { collaborationRequestId: request.id },
        defaults: {
          collaborationRequestId: request.id,
          campaignId: campaign.id,
          ownerId: owner.id,
          influencerId: influencer.id,
          status: seed.collaboration.status,
          startDate: seed.collaboration.startDate || null,
          endDate: seed.collaboration.endDate || null,
          completedAt: seed.collaboration.completedAt || null,
          cancelledAt: seed.collaboration.cancelledAt || null
        }
      });

      await collab.update({
        campaignId: campaign.id,
        ownerId: owner.id,
        influencerId: influencer.id,
        status: seed.collaboration.status,
        startDate: seed.collaboration.startDate || null,
        endDate: seed.collaboration.endDate || null,
        completedAt: seed.collaboration.completedAt || null,
        cancelledAt: seed.collaboration.cancelledAt || null
      });

      collaboration = collab;
    }

    if (seed.contract && collaboration) {
      const [contract] = await CollaborationContract.findOrCreate({
        where: { collaborationId: collaboration.id },
        defaults: {
          collaborationId: collaboration.id,
          agreedPrice: seed.contract.agreedPrice,
          deliverables: seed.contract.deliverables || [],
          startDate: seed.contract.startDate || null,
          endDate: seed.contract.endDate || null,
          status: seed.contract.status,
          ownerSigned: seed.contract.ownerSigned || false,
          influencerSigned: seed.contract.influencerSigned || false,
          ownerSignedAt: seed.contract.ownerSignedAt || null,
          influencerSignedAt: seed.contract.influencerSignedAt || null,
          contractFileUrl: seed.contract.contractFileUrl || null,
          notes: seed.contract.notes || null
        }
      });

      await contract.update({
        agreedPrice: seed.contract.agreedPrice,
        deliverables: seed.contract.deliverables || [],
        startDate: seed.contract.startDate || null,
        endDate: seed.contract.endDate || null,
        status: seed.contract.status,
        ownerSigned: seed.contract.ownerSigned || false,
        influencerSigned: seed.contract.influencerSigned || false,
        ownerSignedAt: seed.contract.ownerSignedAt || null,
        influencerSignedAt: seed.contract.influencerSignedAt || null,
        contractFileUrl: seed.contract.contractFileUrl || null,
        notes: seed.contract.notes || null
      });
    }

    console.log(
      `SEEDED collaboration flow [${seed.stageLabel}] for owner ${firstOwnerEmail} and influencer ${firstInfluencerEmail}`
    );
  }

  console.log(`Seeded ${collaborationSeeds.length} collaboration flow records.`);
}

async function seedTasks() {
  console.log('Seeding collaboration tasks...');

  const firstOwnerEmail = ownerAccounts[0]?.user?.email;
  const firstInfluencerEmail = influencerAccounts[0]?.user?.email;
  const owner = await User.findOne({ where: { email: firstOwnerEmail } });
  const influencer = await User.findOne({ where: { email: firstInfluencerEmail } });
  if (!owner || !influencer) { console.log('SKIPPED tasks: users not found.'); return; }

  for (const seed of taskSeeds) {
    const collabSeed = collaborationSeeds.find(c => c.key === seed.collaborationKey);
    if (!collabSeed?.campaign?.campaignName) continue;

    const campaign = await Campaign.findOne({ where: { userId: owner.id, campaignName: collabSeed.campaign.campaignName } });
    if (!campaign) { console.log(`SKIPPED tasks for key "${seed.collaborationKey}": campaign not found.`); continue; }

    const collab = await Collaboration.findOne({ where: { campaignId: campaign.id, ownerId: owner.id, influencerId: influencer.id } });
    if (!collab) { console.log(`SKIPPED tasks for key "${seed.collaborationKey}": collaboration not found.`); continue; }

    for (const task of seed.tasks) {
      const [, created] = await CollaborationTask.findOrCreate({
        where: { collaborationId: collab.id, taskName: task.taskName },
        defaults: { collaborationId: collab.id, ...task }
      });
      if (!created) await CollaborationTask.update(task, { where: { collaborationId: collab.id, taskName: task.taskName } });
      console.log(`  ${created ? 'CREATED' : 'UPDATED'} task "${task.taskName}" [${seed.collaborationKey}]`);
    }
  }
  console.log('Done seeding tasks.');
}

async function seedMessages() {
  console.log('Seeding chat rooms and messages...');

  const firstOwnerEmail = ownerAccounts[0]?.user?.email;
  const firstInfluencerEmail = influencerAccounts[0]?.user?.email;
  const owner = await User.findOne({ where: { email: firstOwnerEmail } });
  const influencer = await User.findOne({ where: { email: firstInfluencerEmail } });
  if (!owner || !influencer) { console.log('SKIPPED messages: users not found.'); return; }

  for (const seed of messageSeeds) {
    const collabSeed = collaborationSeeds.find(c => c.key === seed.collaborationKey);
    if (!collabSeed?.campaign?.campaignName) continue;

    const campaign = await Campaign.findOne({ where: { userId: owner.id, campaignName: collabSeed.campaign.campaignName } });
    if (!campaign) { console.log(`SKIPPED messages for key "${seed.collaborationKey}": campaign not found.`); continue; }

    const collab = await Collaboration.findOne({ where: { campaignId: campaign.id, ownerId: owner.id, influencerId: influencer.id } });
    if (!collab) { console.log(`SKIPPED messages for key "${seed.collaborationKey}": collaboration not found.`); continue; }

    const [room] = await ChatRoom.findOrCreate({
      where: { collaborationId: collab.id },
      defaults: { collaborationId: collab.id, type: 'one_to_one', name: seed.roomName }
    });

    await ChatParticipant.findOrCreate({ where: { chatRoomId: room.id, userId: owner.id },      defaults: { chatRoomId: room.id, userId: owner.id,      role: 'owner' } });
    await ChatParticipant.findOrCreate({ where: { chatRoomId: room.id, userId: influencer.id }, defaults: { chatRoomId: room.id, userId: influencer.id, role: 'influencer' } });

    const existingCount = await Message.count({ where: { chatRoomId: room.id } });
    if (existingCount === 0) {
      const now = Date.now();
      for (const msg of seed.messages) {
        const senderId = msg.senderRole === 'owner' ? owner.id : influencer.id;
        const sentAt = new Date(now - msg.minutesAgo * 60 * 1000);
        await Message.create({ chatRoomId: room.id, senderId, content: msg.content, sentAt, status: msg.status });
      }
      console.log(`  CREATED room + ${seed.messages.length} messages [${seed.collaborationKey}]`);
    } else {
      console.log(`  EXISTS room (${existingCount} messages) [${seed.collaborationKey}]`);
    }
  }
  console.log('Done seeding messages.');
}

async function seedNotifications() {
  console.log('Seeding notifications...');

  const firstOwnerEmail = ownerAccounts[0]?.user?.email;
  const firstInfluencerEmail = influencerAccounts[0]?.user?.email;
  const owner = await User.findOne({ where: { email: firstOwnerEmail } });
  const influencer = await User.findOne({ where: { email: firstInfluencerEmail } });
  if (!owner || !influencer) { console.log('SKIPPED notifications: users not found.'); return; }

  await Notification.destroy({ where: { userId: [owner.id, influencer.id] } });

  for (const n of notificationSeeds) {
    const userId = n.recipientRole === 'owner' ? owner.id : influencer.id;

    let entityId = null;
    if (n.collaborationKey) {
      const collabSeed = collaborationSeeds.find(c => c.key === n.collaborationKey);
      if (collabSeed?.campaign?.campaignName) {
        const campaign = await Campaign.findOne({ where: { userId: owner.id, campaignName: collabSeed.campaign.campaignName } });
        if (campaign) {
          if (n.entityType === 'CollaborationRequest') {
            const req = await CollaborationRequest.findOne({ where: { campaignId: campaign.id, ownerId: owner.id, influencerId: influencer.id } });
            entityId = req?.id ?? null;
          } else if (n.entityType === 'CollaborationContract' || n.entityType === 'CollaborationTask' || n.entityType === 'ChatRoom') {
            const collab = await Collaboration.findOne({ where: { campaignId: campaign.id, ownerId: owner.id, influencerId: influencer.id } });
            if (collab) {
              if (n.entityType === 'CollaborationContract') {
                const contract = await CollaborationContract.findOne({ where: { collaborationId: collab.id } });
                entityId = contract?.id ?? null;
              } else if (n.entityType === 'CollaborationTask') {
                const task = await CollaborationTask.findOne({ where: { collaborationId: collab.id, taskName: n.metadata?.taskName } });
                entityId = task?.id ?? null;
              } else if (n.entityType === 'ChatRoom') {
                const room = await ChatRoom.findOne({ where: { collaborationId: collab.id } });
                entityId = room?.id ?? null;
              }
            }
          }
        }
      }
    }

    await Notification.create({
      userId,
      type: n.type,
      message: n.message,
      entityType: n.entityType,
      entityId,
      metadata: n.metadata || null,
      isRead: n.isRead
    });
    console.log(`  CREATED notification [${n.type}] for ${n.recipientRole}`);
  }
  console.log('Done seeding notifications.');
}

async function seedReviews() {
  console.log('Seeding reviews...');

  const firstOwnerEmail = ownerAccounts[0]?.user?.email;
  const firstInfluencerEmail = influencerAccounts[0]?.user?.email;
  const owner = await User.findOne({ where: { email: firstOwnerEmail } });
  const influencer = await User.findOne({ where: { email: firstInfluencerEmail } });
  if (!owner || !influencer) { console.log('SKIPPED reviews: users not found.'); return; }

  for (const seed of reviewSeeds) {
    const collabSeed = collaborationSeeds.find(c => c.key === seed.collaborationKey);
    if (!collabSeed?.campaign?.campaignName) continue;

    const campaign = await Campaign.findOne({ where: { userId: owner.id, campaignName: collabSeed.campaign.campaignName } });
    if (!campaign) { console.log(`SKIPPED review for key "${seed.collaborationKey}": campaign not found.`); continue; }

    const collab = await Collaboration.findOne({ where: { campaignId: campaign.id, ownerId: owner.id, influencerId: influencer.id } });
    if (!collab) { console.log(`SKIPPED review for key "${seed.collaborationKey}": collaboration not found.`); continue; }

    const reviewerId = seed.reviewerRole === 'owner' ? owner.id : influencer.id;
    const [, created] = await Review.findOrCreate({
      where: { collaborationId: collab.id, ownerId: owner.id, influencerId: influencer.id, reviewText: seed.reviewText },
      defaults: {
        ownerId: owner.id,
        influencerId: influencer.id,
        collaborationId: collab.id,
        rating: seed.rating,
        reviewText: seed.reviewText
      }
    });
    console.log(`  ${created ? 'CREATED' : 'EXISTS'} review by ${seed.reviewerRole} [${seed.collaborationKey}]`);
  }
  console.log('Done seeding reviews.');
}

async function runAllSeeds() {
  try {
    await sequelize.authenticate();
    console.log('Syncing database...');
    await sequelize.sync({ alter: true });
    console.log('Database synced.');
    await seedInfluencers();
    await seedOwners();
    await seedCampaigns();
    await seedCollaborations();
    await seedTasks();
    await seedMessages();
    await seedNotifications();
    await seedReviews();
    await seedTrackingCampaigns({
      Campaign, KPI, TargetAudience, ContentCalendar, PostAnalytics, User
    }, 'owner01@example.com');

    console.log('Done. All entities seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

runAllSeeds();
