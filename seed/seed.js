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
  CampaignAIVersion
} = require('../models');
const influencerAccounts = require('./influencer/data');
const ownerAccounts = require('./owner/data');
const campaignSeeds = require('./compagins/data');

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

async function runAllSeeds() {
  try {
    await sequelize.authenticate();
    await seedInfluencers();
    await seedOwners();
    // await seedCampaigns();
    
    console.log('Done. Seeded all accounts and campaigns successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

runAllSeeds();
