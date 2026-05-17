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
  CollaborationContract
} = require('../models');
const influencerAccounts = require('./influencer/data');
const ownerAccounts = require('./owner/data');
const campaignSeeds = require('./compagins/data');
const collaborationSeeds = require('./collaboration/data');

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
  console.log("Seeding campaigns...");

  for (const seed of campaignSeeds) {
    try {
      // 1. Validate seed
      if (!seed?.ownerEmail || !seed?.campaign?.campaignName) {
        console.log("SKIPPED invalid campaign seed:", seed);
        continue;
      }

      // 2. Find owner by email
      const owner = await User.findOne({
        where: { email: seed.ownerEmail }
      });

      if (!owner) {
        console.log(
          `SKIPPED campaign "${seed.campaign.campaignName}": owner not found (${seed.ownerEmail})`
        );
        continue;
      }

      // 3. Create or update campaign
      const [campaign, created] = await Campaign.findOrCreate({
        where: {
          userId: owner.id,
          campaignName: seed.campaign.campaignName
        },
        defaults: {
          userId: owner.id,
          ...seed.campaign
        }
      });

      if (!created) {
        await campaign.update(seed.campaign);
      }

      console.log(
        `${created ? "CREATED" : "UPDATED"} campaign: ${campaign.campaignName}`
      );
    } catch (err) {
      console.error("Error seeding campaign:", err);
    }
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

async function runAllSeeds() {
  try {
    await sequelize.authenticate();
    //await seedInfluencers();
    //await seedOwners();
    await seedCampaigns();
    // await seedCollaborations();
    
    console.log('Done. Seeded all accounts and campaigns successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

runAllSeeds();
