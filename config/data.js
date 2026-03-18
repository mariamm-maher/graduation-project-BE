const sequelize = require('./db');
const {
  User,
  Role,
  OwnerProfile,
  InfluencerProfile,
  Campaign,
  CollaborationRequest,
  Collaboration,
  CollaborationContract,
  CollaborationTask,
  ChatRoom,
  ChatParticipant,
  Message,
  Notification
} = require('../models');

async function ensureUserRole(user, role) {
  const roles = await user.getRoles({ where: { id: role.id } });
  if (!roles.length) {
    await user.addRole(role);
    console.log(`✅ Role ${role.name} assigned to ${user.email}`);
  } else {
    console.log(`ℹ️ Role ${role.name} already assigned to ${user.email}`);
  }
}

async function seedData() {
  try {
    await sequelize.authenticate();
    console.log('Database connected. Starting comprehensive seed...');

    // -----------------------------------------------------------------------
    // 1) ROLES (enum-constrained to 3 values)
    // -----------------------------------------------------------------------
    const roleNames = ['OWNER', 'INFLUENCER', 'ADMIN'];
    const roleMap = {};

    for (const roleName of roleNames) {
      const [role, created] = await Role.findOrCreate({ where: { name: roleName } });
      roleMap[roleName] = role;
      console.log(created ? `✅ Role ${roleName} created.` : `ℹ️ Role ${roleName} already exists.`);
    }

    console.log('ℹ️ Role table is enum-limited to 3 unique roles (OWNER, INFLUENCER, ADMIN).');

    // -----------------------------------------------------------------------
    // 2) USERS (5 owners + 5 influencers + 1 admin)
    // -----------------------------------------------------------------------
    const ownerSeeds = [
      { firstName: 'John', lastName: 'Doe', email: 'owner1@example.com', status: 'ACTIVE' },
      { firstName: 'Sarah', lastName: 'Miller', email: 'owner2@example.com', status: 'ACTIVE' },
      { firstName: 'Ahmed', lastName: 'Khaled', email: 'owner3@example.com', status: 'ACTIVE' },
      { firstName: 'Lina', lastName: 'Nassar', email: 'owner4@example.com', status: 'ACTIVE' },
      { firstName: 'Michael', lastName: 'Brown', email: 'owner5@example.com', status: 'ACTIVE' }
    ];

    const influencerSeeds = [
      { firstName: 'Jane', lastName: 'Smith', email: 'influencer1@example.com', status: 'ACTIVE' },
      { firstName: 'Omar', lastName: 'Ali', email: 'influencer2@example.com', status: 'ACTIVE' },
      { firstName: 'Maya', lastName: 'Adel', email: 'influencer3@example.com', status: 'ACTIVE' },
      { firstName: 'Noah', lastName: 'Wilson', email: 'influencer4@example.com', status: 'ACTIVE' },
      { firstName: 'Emma', lastName: 'Taylor', email: 'influencer5@example.com', status: 'ACTIVE' }
    ];

    const ownerUsers = [];
    const influencerUsers = [];

    for (const seed of ownerSeeds) {
      const [user, created] = await User.findOrCreate({
        where: { email: seed.email },
        defaults: {
          firstName: seed.firstName,
          lastName: seed.lastName,
          email: seed.email,
          password: 'password123',
          status: seed.status
        }
      });

      ownerUsers.push(user);
      console.log(created ? `✅ Owner user ${seed.email} created.` : `ℹ️ Owner user ${seed.email} already exists.`);
      await ensureUserRole(user, roleMap.OWNER);
    }

    for (const seed of influencerSeeds) {
      const [user, created] = await User.findOrCreate({
        where: { email: seed.email },
        defaults: {
          firstName: seed.firstName,
          lastName: seed.lastName,
          email: seed.email,
          password: 'password123',
          status: seed.status
        }
      });

      influencerUsers.push(user);
      console.log(created ? `✅ Influencer user ${seed.email} created.` : `ℹ️ Influencer user ${seed.email} already exists.`);
      await ensureUserRole(user, roleMap.INFLUENCER);
    }

    const [adminUser, adminCreated] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: 'Admin@1234',
        status: 'ACTIVE'
      }
    });
    console.log(adminCreated ? '✅ Admin user created.' : 'ℹ️ Admin user already exists.');
    await ensureUserRole(adminUser, roleMap.ADMIN);

    // -----------------------------------------------------------------------
    // 3) OWNER PROFILES (5)
    // -----------------------------------------------------------------------
    const ownerProfileSeeds = [
      { businessName: 'Tech Innovators', businessType: 'Startup', industry: 'Technology', location: 'New York, US', description: 'Leading software and AI solutions.', website: 'https://techinnovators.example.com', phoneNumber: '+1-555-0101' },
      { businessName: 'Green Horizon', businessType: 'SME', industry: 'Sustainability', location: 'Berlin, DE', description: 'Eco-friendly consumer products.', website: 'https://greenhorizon.example.com', phoneNumber: '+49-30-555-0102' },
      { businessName: 'FitNation', businessType: 'Enterprise', industry: 'Health & Fitness', location: 'London, UK', description: 'Wellness and fitness brand.', website: 'https://fitnation.example.com', phoneNumber: '+44-20-555-0103' },
      { businessName: 'StylePulse', businessType: 'SME', industry: 'Fashion', location: 'Paris, FR', description: 'Modern lifestyle and apparel.', website: 'https://stylepulse.example.com', phoneNumber: '+33-1-555-0104' },
      { businessName: 'FoodTrail', businessType: 'Startup', industry: 'Food & Beverage', location: 'Toronto, CA', description: 'Premium snacks and healthy meals.', website: 'https://foodtrail.example.com', phoneNumber: '+1-416-555-0105' }
    ];

    for (let index = 0; index < ownerUsers.length; index += 1) {
      const user = ownerUsers[index];
      const profileSeed = ownerProfileSeeds[index];

      const [profile, created] = await OwnerProfile.findOrCreate({
        where: { userId: user.id },
        defaults: {
          userId: user.id,
          businessName: profileSeed.businessName,
          businessType: profileSeed.businessType,
          industry: profileSeed.industry,
          location: profileSeed.location,
          description: profileSeed.description,
          website: profileSeed.website,
          phoneNumber: profileSeed.phoneNumber,
          platformsUsed: ['Instagram', 'TikTok', 'YouTube'],
          primaryMarketingGoal: 'awareness',
          targetAudience: { ageRange: '18-34', gender: 'all', location: profileSeed.location },
          completionPercentage: 100,
          isOnboarded: true,
          isCompleted: true
        }
      });

      console.log(created ? `✅ OwnerProfile created for ${user.email}.` : `ℹ️ OwnerProfile already exists for ${user.email}.`);
      void profile;
    }

    // -----------------------------------------------------------------------
    // 4) INFLUENCER PROFILES (5)
    // -----------------------------------------------------------------------
    const influencerProfileSeeds = [
      { bio: 'Tech reviewer and startup storyteller.', location: 'Los Angeles, US', primaryPlatform: 'YouTube', followersCount: '120000', engagementRate: '6.1', categories: ['Technology', 'Business'] },
      { bio: 'Fitness creator focused on home workouts.', location: 'Madrid, ES', primaryPlatform: 'Instagram', followersCount: '95000', engagementRate: '5.4', categories: ['Fitness', 'Health'] },
      { bio: 'Fashion and beauty trend creator.', location: 'Milan, IT', primaryPlatform: 'TikTok', followersCount: '210000', engagementRate: '7.2', categories: ['Fashion', 'Beauty'] },
      { bio: 'Food vlogger and recipe storyteller.', location: 'Cairo, EG', primaryPlatform: 'Instagram', followersCount: '88000', engagementRate: '4.9', categories: ['Food', 'Lifestyle'] },
      { bio: 'Travel filmmaker and culture explorer.', location: 'Istanbul, TR', primaryPlatform: 'YouTube', followersCount: '150000', engagementRate: '6.8', categories: ['Travel', 'Lifestyle'] }
    ];

    for (let index = 0; index < influencerUsers.length; index += 1) {
      const user = influencerUsers[index];
      const profileSeed = influencerProfileSeeds[index];

      const [profile, created] = await InfluencerProfile.findOrCreate({
        where: { userId: user.id },
        defaults: {
          userId: user.id,
          bio: profileSeed.bio,
          location: profileSeed.location,
          socialMediaLinks: {
            instagram: `https://instagram.com/${user.firstName.toLowerCase()}${index + 1}`,
            tiktok: `https://tiktok.com/@${user.firstName.toLowerCase()}${index + 1}`,
            youtube: `https://youtube.com/@${user.firstName.toLowerCase()}${index + 1}`
          },
          primaryPlatform: profileSeed.primaryPlatform,
          followersCount: profileSeed.followersCount,
          engagementRate: profileSeed.engagementRate,
          categories: profileSeed.categories,
          contentTypes: ['post', 'reel', 'video'],
          collaborationTypes: ['sponsored_post', 'product_review'],
          audienceAgeRange: '18-34',
          audienceGender: 'all',
          audienceLocation: profileSeed.location,
          interests: ['tech', 'fitness', 'fashion', 'food', 'travel'],
          completionPercentage: 100,
          isOnboarded: true,
          isCompleted: true
        }
      });

      console.log(created ? `✅ InfluencerProfile created for ${user.email}.` : `ℹ️ InfluencerProfile already exists for ${user.email}.`);
      void profile;
    }

    // -----------------------------------------------------------------------
    // 5) CAMPAIGNS (10 for owner1)
    // -----------------------------------------------------------------------
    const campaignSeeds = [
      { campaignName: 'O1 Campaign 1 - Draft', UserDescription: 'C1', lifecycleStage: 'draft', goalType: 'awareness', totalBudget: 5000, currency: 'USD', budgetFlexibility: 'flexible', isPublished: false },
      { campaignName: 'O1 Campaign 2 - AI Gen', UserDescription: 'C2', lifecycleStage: 'ai_generated', goalType: 'awareness', totalBudget: 5000, currency: 'USD', budgetFlexibility: 'flexible', isPublished: false },
      { campaignName: 'O1 Campaign 3 - Saved', UserDescription: 'C3', lifecycleStage: 'saved', goalType: 'awareness', totalBudget: 5000, currency: 'USD', budgetFlexibility: 'flexible', isPublished: true },
      { campaignName: 'O1 Campaign 4 - Pub', UserDescription: 'C4', lifecycleStage: 'published', goalType: 'awareness', totalBudget: 6000, currency: 'USD', budgetFlexibility: 'flexible', isPublished: true },
      { campaignName: 'O1 Campaign 5 - Pub', UserDescription: 'C5', lifecycleStage: 'published', goalType: 'awareness', totalBudget: 7000, currency: 'USD', budgetFlexibility: 'flexible', isPublished: true },
      { campaignName: 'O1 Campaign 6 - Completed', UserDescription: 'C6', lifecycleStage: 'completed', goalType: 'awareness', totalBudget: 8000, currency: 'USD', budgetFlexibility: 'flexible', isPublished: true },
      { campaignName: 'O1 Campaign 7 - Cancelled', UserDescription: 'C7', lifecycleStage: 'cancelled', goalType: 'awareness', totalBudget: 4000, currency: 'USD', budgetFlexibility: 'flexible', isPublished: true },
      { campaignName: 'O1 Campaign 8 - Draft 2', UserDescription: 'C8', lifecycleStage: 'draft', goalType: 'awareness', totalBudget: 5000, currency: 'USD', budgetFlexibility: 'flexible', isPublished: false },
      { campaignName: 'O1 Campaign 9 - Pub 2', UserDescription: 'C9', lifecycleStage: 'published', goalType: 'awareness', totalBudget: 9000, currency: 'USD', budgetFlexibility: 'flexible', isPublished: true },
      { campaignName: 'O1 Campaign 10 - Completed 2', UserDescription: 'C10', lifecycleStage: 'completed', goalType: 'awareness', totalBudget: 6000, currency: 'USD', budgetFlexibility: 'flexible', isPublished: true }
    ];

    const campaigns = [];
    for (let index = 0; index < campaignSeeds.length; index += 1) {
      const owner = ownerUsers[0]; // always owner1
      const seed = campaignSeeds[index];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + index);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30 + (index * 5));

      const [campaign, created] = await Campaign.findOrCreate({
        where: { campaignName: seed.campaignName },
        defaults: {
          userId: owner.id,
          campaignName: seed.campaignName,
          UserDescription: seed.UserDescription,
          lifecycleStage: seed.lifecycleStage,
          goalType: seed.goalType,
          totalBudget: seed.totalBudget,
          currency: seed.currency,
          budgetFlexibility: seed.budgetFlexibility,
          isPublished: seed.isPublished,
          startDate,
          endDate
        }
      });

      campaigns.push(campaign);
      console.log(created ? ` Campaign ${seed.campaignName} created.` : `? Campaign ${seed.campaignName} already exists.`);
    }

    // -----------------------------------------------------------------------
    // 6) COLLABORATION REQUESTS (5)
    // -----------------------------------------------------------------------
    const requestStatuses = ['pending', 'negotiating', 'accepted', 'rejected', 'cancelled', 'accepted', 'accepted', 'accepted', 'accepted', 'accepted'];
    const requests = [];

    for (let index = 0; index < 10; index += 1) {
      const campaign = campaigns[index];
      const owner = ownerUsers[0];
      const influencer = influencerUsers[0];
      const status = requestStatuses[index];

      const [request, created] = await CollaborationRequest.findOrCreate({
        where: {
          campaignId: campaign.id,
          ownerId: owner.id,
          influencerId: influencer.id
        },
        defaults: {
          campaignId: campaign.id,
          ownerId: owner.id,
          influencerId: influencer.id,
          status,
          proposedBudget: 1000 + (index * 300),
          counterPrice: status === 'negotiating' ? 1200 + (index * 200) : null,
          lastCounteredBy: status === 'negotiating' ? influencer.id : null,
          message: `Invitation to collaborate on ${campaign.campaignName}`,
          responseMessage: status === 'accepted'
            ? 'Happy to collaborate!'
            : status === 'rejected'
              ? 'Not aligned at this time.'
              : null,
          expiresAt: new Date(Date.now() + (7 + index) * 24 * 60 * 60 * 1000)
        }
      });

      requests.push(request);
      console.log(created ? `✅ CollaborationRequest #${request.id} created.` : `ℹ️ CollaborationRequest #${request.id} already exists.`);
    }

    // -----------------------------------------------------------------------
    // 7) COLLABORATIONS (5)
    // -----------------------------------------------------------------------
    const collaborationStatuses = ['pending_contract_sign', 'live', 'in_progress', 'completed', 'cancelled', 'pending_contract_sign', 'live', 'in_progress', 'completed', 'cancelled'];
    const collaborations = [];

    for (let index = 0; index < 10; index += 1) {
      const request = requests[index];
      const campaign = campaigns[index];
      const owner = ownerUsers[0];
      const influencer = influencerUsers[0];
      const status = collaborationStatuses[index];

      const [collaboration, created] = await Collaboration.findOrCreate({
        where: { collaborationRequestId: request.id },
        defaults: {
          collaborationRequestId: request.id,
          campaignId: campaign.id,
          ownerId: owner.id,
          influencerId: influencer.id,
          status,
          startDate: index > 0 ? new Date(Date.now() - (index * 2) * 24 * 60 * 60 * 1000) : null,
          endDate: index > 0 ? new Date(Date.now() + (20 - index) * 24 * 60 * 60 * 1000) : null,
          completedAt: status === 'completed' ? new Date() : null,
          cancelledAt: status === 'cancelled' ? new Date() : null
        }
      });

      collaborations.push(collaboration);
      console.log(created ? `✅ Collaboration #${collaboration.id} created.` : `ℹ️ Collaboration #${collaboration.id} already exists.`);
    }

    // -----------------------------------------------------------------------
    // 8) COLLABORATION CONTRACTS (5)
    // -----------------------------------------------------------------------
    const contractStatuses = ['sent', 'partially_signed', 'signed', 'cancelled', 'sent', 'partially_signed', 'signed', 'cancelled', 'sent', 'signed'];
    const contracts = [];

    for (let index = 0; index < 10; index += 1) {
      const collaboration = collaborations[index];
      const request = requests[index];
      const status = contractStatuses[index];
      const now = new Date();

      const [contract, created] = await CollaborationContract.findOrCreate({
        where: { collaborationId: collaboration.id },
        defaults: {
          collaborationId: collaboration.id,
          agreedPrice: request.proposedBudget || 1500,
          deliverables: [
            {
              title: `Deliverable ${index + 1}`,
              description: 'One feed post + one story mention',
              platform: influencerProfileSeeds[index % 5].primaryPlatform,
              contentType: 'post',
              dueDate: new Date(now.getTime() + (10 + index) * 24 * 60 * 60 * 1000)
            }
          ],
          startDate: now,
          endDate: new Date(now.getTime() + (30 + index) * 24 * 60 * 60 * 1000),
          status,
          ownerSigned: status === 'partially_signed' || status === 'signed',
          influencerSigned: status === 'signed',
          ownerSignedAt: status === 'partially_signed' || status === 'signed' ? now : null,
          influencerSignedAt: status === 'signed' ? now : null,
          notes: `Auto-seeded contract with status ${status}`
        }
      });

      contracts.push(contract);
      console.log(created ? `✅ CollaborationContract #${contract.id} created.` : `ℹ️ CollaborationContract #${contract.id} already exists.`);
    }

    // -----------------------------------------------------------------------
    // 9) TASKS (if exists) — 5+ entries
    // -----------------------------------------------------------------------
    const taskStatusCycle = ['todo', 'in_progress', 'in_review', 'approved', 'rejected', 'todo', 'in_progress', 'in_review', 'approved', 'rejected'];
    const tasks = [];

    for (let index = 0; index < 10; index += 1) {
      const collaboration = collaborations[index];
      const status = taskStatusCycle[index];
      const [task, created] = await CollaborationTask.findOrCreate({
        where: {
          collaborationId: collaboration.id,
          taskName: `Seed Task ${index + 1} for Collab ${collaboration.id}`
        },
        defaults: {
          collaborationId: collaboration.id,
          taskName: `Seed Task ${index + 1} for Collab ${collaboration.id}`,
          description: 'Create sponsored content and submit for review.',
          status,
          sortOrder: index,
          dueDate: new Date(Date.now() + (7 + index) * 24 * 60 * 60 * 1000),
          completedAt: status === 'approved' ? new Date() : null,
          platform: 'instagram',
          contentType: 'post',
          submissionNote: status === 'in_review' || status === 'approved' ? 'Submitted from seeded script' : null,
          submittedAt: status === 'in_review' || status === 'approved' ? new Date() : null,
          reviewNote: status === 'rejected' ? 'Needs content quality improvements.' : null
        }
      });

      tasks.push(task);
      console.log(created ? `✅ CollaborationTask #${task.id} created.` : `ℹ️ CollaborationTask #${task.id} already exists.`);
    }

    // -----------------------------------------------------------------------
    // 10) CHAT (if exists) — ChatRoom + ChatParticipant + Message
    // -----------------------------------------------------------------------
    const chatRooms = [];

    for (let index = 0; index < 10; index += 1) {
      const collaboration = collaborations[index];
      const owner = ownerUsers[0];
      const influencer = influencerUsers[0];

      const [room, roomCreated] = await ChatRoom.findOrCreate({
        where: { collaborationId: collaboration.id },
        defaults: {
          collaborationId: collaboration.id,
          type: 'one_to_one',
          name: `Collab Chat ${collaboration.id}`
        }
      });

      chatRooms.push(room);
      console.log(roomCreated ? `✅ ChatRoom #${room.id} created.` : `ℹ️ ChatRoom #${room.id} already exists.`);

      const [ownerParticipant, ownerParticipantCreated] = await ChatParticipant.findOrCreate({
        where: { chatRoomId: room.id, userId: owner.id },
        defaults: {
          chatRoomId: room.id,
          userId: owner.id,
          role: 'owner',
          joinedAt: new Date()
        }
      });
      console.log(ownerParticipantCreated
        ? `✅ ChatParticipant(owner) created for room #${room.id}.`
        : `ℹ️ ChatParticipant(owner) already exists for room #${room.id}.`);
      void ownerParticipant;

      const [influencerParticipant, influencerParticipantCreated] = await ChatParticipant.findOrCreate({
        where: { chatRoomId: room.id, userId: influencer.id },
        defaults: {
          chatRoomId: room.id,
          userId: influencer.id,
          role: 'influencer',
          joinedAt: new Date()
        }
      });
      console.log(influencerParticipantCreated
        ? `✅ ChatParticipant(influencer) created for room #${room.id}.`
        : `ℹ️ ChatParticipant(influencer) already exists for room #${room.id}.`);
      void influencerParticipant;

      const [messageA, messageACreated] = await Message.findOrCreate({
        where: {
          chatRoomId: room.id,
          senderId: owner.id,
          content: `Hello from owner ${owner.firstName} in room ${room.id}`
        },
        defaults: {
          chatRoomId: room.id,
          senderId: owner.id,
          content: `Hello from owner ${owner.firstName} in room ${room.id}`,
          status: 'sent',
          sentAt: new Date()
        }
      });
      console.log(messageACreated ? `✅ Message #${messageA.id} created.` : `ℹ️ Message #${messageA.id} already exists.`);

      const [messageB, messageBCreated] = await Message.findOrCreate({
        where: {
          chatRoomId: room.id,
          senderId: influencer.id,
          content: `Reply from influencer ${influencer.firstName} in room ${room.id}`
        },
        defaults: {
          chatRoomId: room.id,
          senderId: influencer.id,
          content: `Reply from influencer ${influencer.firstName} in room ${room.id}`,
          status: 'delivered',
          sentAt: new Date()
        }
      });
      console.log(messageBCreated ? `✅ Message #${messageB.id} created.` : `ℹ️ Message #${messageB.id} already exists.`);
    }

    // -----------------------------------------------------------------------
    // 11) NOTIFICATIONS (if exists) — 5+ entries
    // -----------------------------------------------------------------------
    const notificationSeeds = [
      { userId: influencerUsers[0].id, type: 'CAMPAIGN_INVITATION', message: 'You have a new campaign invitation.', entityType: 'Campaign', entityId: campaigns[0].id },
      { userId: ownerUsers[0].id, type: 'CAMPAIGN_PUBLISHED', message: 'Your campaign was published successfully.', entityType: 'Campaign', entityId: campaigns[0].id },
      { userId: ownerUsers[1].id, type: 'CONTRACT_SENT', message: 'Contract was sent to influencer.', entityType: 'CollaborationContract', entityId: contracts[1].id },
      { userId: influencerUsers[2].id, type: 'TASK_ASSIGNED', message: 'A new task has been assigned to you.', entityType: 'CollaborationTask', entityId: tasks[2].id },
      { userId: ownerUsers[3].id, type: 'MESSAGE_RECEIVED', message: 'You received a new chat message.', entityType: 'Message', entityId: 1 },
      { userId: influencerUsers[4].id, type: 'AI_CAMPAIGN_READY', message: 'AI campaign draft is ready for review.', entityType: 'Campaign', entityId: campaigns[4].id },
      { userId: ownerUsers[2].id, type: 'CONTRACT_SIGNED', message: 'Contract has been fully signed.', entityType: 'CollaborationContract', entityId: contracts[2].id },
      { userId: influencerUsers[1].id, type: 'TASK_SUBMITTED', message: 'Task submitted and awaiting review.', entityType: 'CollaborationTask', entityId: tasks[1].id }
    ];

    for (const seed of notificationSeeds) {
      const [notification, created] = await Notification.findOrCreate({
        where: {
          userId: seed.userId,
          type: seed.type,
          message: seed.message,
          entityType: seed.entityType,
          entityId: seed.entityId
        },
        defaults: {
          userId: seed.userId,
          type: seed.type,
          message: seed.message,
          entityType: seed.entityType,
          entityId: seed.entityId,
          metadata: { seeded: true },
          isRead: false,
          readAt: null
        }
      });

      console.log(created ? `✅ Notification #${notification.id} created (${seed.type}).` : `ℹ️ Notification already exists (${seed.type}).`);
    }

    console.log('🌱 Comprehensive seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
