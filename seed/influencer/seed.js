const sequelize = require('../../config/db');
const { User, Role, InfluencerProfile } = require('../../models');
const influencerAccounts = require('./data');

async function ensureInfluencerRole(user, influencerRole) {
  const roles = await user.getRoles({ where: { id: influencerRole.id } });
  if (!roles.length) {
    await user.addRole(influencerRole);
  }
}

async function seedInfluencers() {
  try {
    await sequelize.authenticate();

    const [influencerRole] = await Role.findOrCreate({
      where: { name: 'INFLUENCER' }
    });

    for (const account of influencerAccounts) {
      const [user, userCreated] = await User.findOrCreate({
        where: { email: account.user.email },
        defaults: account.user
      });

      await ensureInfluencerRole(user, influencerRole);

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
        `${userCreated ? 'CREATED' : 'EXISTS'} user ${user.email} | ${profileCreated ? 'CREATED' : 'UPDATED'} profile`
      );
      void profile;
    }

    console.log(`Done. Seeded ${influencerAccounts.length} influencer accounts with full profiles.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding influencer accounts:', error);
    process.exit(1);
  }
}

seedInfluencers();
