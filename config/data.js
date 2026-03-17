const sequelize = require('./db');
const { 
  User, 
  Role, 
  OwnerProfile, 
  InfluencerProfile, 
  Campaign,
  CollaborationRequest,
  Collaboration,
  CollaborationContract
} = require('../models');

async function seedData() {
  try {
    await sequelize.authenticate();
    console.log('Database connected. Starting seed...');

    // 1. Ensure Roles exist
    const [ownerRole] = await Role.findOrCreate({ where: { name: 'OWNER' } });
    const [influencerRole] = await Role.findOrCreate({ where: { name: 'INFLUENCER' } });

    // 2. Create Owner User (if not exists)
    const [ownerUser, ownerCreated] = await User.findOrCreate({
      where: { email: 'owner@example.com' },
      defaults: {
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123', // Assuming User model has a hook to hash the password
        status: 'ACTIVE'
      }
    });

    if (ownerCreated) {
      // Assign Role
      await ownerUser.addRole(ownerRole);
      
      // Create Owner Profile
      await OwnerProfile.create({
        userId: ownerUser.id,
        businessName: 'Tech Innovators',
        industry: 'Technology',
        location: 'New York, US',
        description: 'Leading software platform.',
        isOnboarded: true,
        isCompleted: true,
        completionPercentage: 100
      });
      console.log('✅ Owner created successfully.');
    } else {
      console.log('ℹ️ Owner already exists.');
    }

    // 3. Create Influencer User (if not exists)
    const [influencerUser, influencerCreated] = await User.findOrCreate({
      where: { email: 'influencer@example.com' },
      defaults: {
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'password123', 
        status: 'ACTIVE'
      }
    });

    if (influencerCreated) {
      // Assign Role
      await influencerUser.addRole(influencerRole);
      
      // Create Influencer Profile
      await InfluencerProfile.create({
        userId: influencerUser.id,
        bio: 'Tech and lifestyle creator.',
        location: 'Los Angeles, US',
        primaryPlatform: 'Instagram',
        followersCount: 50000,
        engagementRate: 5.2,
        isOnboarded: true,
        isCompleted: true,
        completionPercentage: 100
      });
      console.log('✅ Influencer created successfully.');
    } else {
      console.log('ℹ️ Influencer already exists.');
    }

    // 4. Create 5 Campaigns for 5 different Owner users (all published)
    const ownerEmails = [
      'owner@example.com',
      'owner1@example.com',
      'owner2@example.com',
      'owner3@example.com',
      'owner4@example.com'
    ];

    for (const [index, email] of ownerEmails.entries()) {
      const [user, userCreated] = await User.findOrCreate({
        where: { email },
        defaults: {
          firstName: `Owner${index + 1}`,
          lastName: 'User',
          password: 'password123',
          status: 'ACTIVE'
        }
      });

      if (userCreated) {
        await user.addRole(ownerRole);
        await OwnerProfile.create({
          userId: user.id,
          businessName: `Business ${index + 1}`,
          industry: 'Technology',
          location: 'City, Country',
          description: 'Seeded owner account',
          isOnboarded: true,
          isCompleted: true,
          completionPercentage: 100
        });
        console.log(`✅ Owner ${email} created.`);
      } else {
        console.log(`ℹ️ Owner ${email} already exists.`);
      }

      const campaignName = `Seeded Campaign ${index + 1} - ${email.split('@')[0]}`;
      const [campaign, campaignCreated] = await Campaign.findOrCreate({
        where: { campaignName },
        defaults: {
          userId: user.id,
          UserDescription: `Campaign for ${email}`,
          lifecycleStage: 'saved',
          isPublished: true,
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          totalBudget: 1000 + index * 500,
          goalType: 'awareness',
          currency: 'USD'
        }
      });

      if (campaignCreated) {
        console.log(`✅ Campaign "${campaignName}" created for ${email}.`);
      } else {
        console.log(`ℹ️ Campaign "${campaignName}" already exists.`);
      }
    }

    // Pick one seeded campaign to use for the collaboration request below
    const primaryCampaign = await Campaign.findOne({ where: { campaignName: 'Seeded Campaign 1 - owner' } });
    const campaign = primaryCampaign || (await Campaign.findOne());

    // 5. Create a Collaboration Request from Owner to Influencer
    const [request, requestCreated] = await CollaborationRequest.findOrCreate({
      where: { 
        campaignId: campaign.id, 
        influencerId: influencerUser.id 
      },
      defaults: {
        ownerId: ownerUser.id,
        proposedBudget: 1500.00,
        message: 'We would love to collaborate with you on this campaign!',
        status: 'accepted',
        responseMessage: 'Sounds great! I accept.'
      }
    });

    if (requestCreated) {
      console.log('✅ Collaboration Request created and accepted.');
    } else {
      console.log('ℹ️ Collaboration Request already exists.');
    }

    // 6. Create the resulting Collaboration (Because the request is 'accepted')
    const [collaboration, collabCreated] = await Collaboration.findOrCreate({
      where: { collaborationRequestId: request.id },
      defaults: {
        campaignId: campaign.id,
        ownerId: ownerUser.id,
        influencerId: influencerUser.id,
        // Using the precise enum value
        status: 'pending_contract_sign'
      }
    });

    if (collabCreated) {
      console.log('✅ Collaboration generated (Pending Contract Sign).');
    } else {
      console.log('ℹ️ Collaboration already exists.');
    }

    // 7. Create a Contract from Owner (draft -> sent)
    const [contract, contractCreated] = await CollaborationContract.findOrCreate({
      where: { collaborationId: collaboration.id },
      defaults: {
        collaborationId: collaboration.id,
        agreedPrice: request.proposedBudget || 1500.00,
        deliverables: [
          {
            title: 'Instagram product promotion',
            description: 'One post + one story mention',
            platform: 'Instagram',
            contentType: 'post',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 10))
          }
        ],
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        status: 'signed',
        ownerSigned: true,
        influencerSigned: true,
        ownerSignedAt: new Date(),
        influencerSignedAt: new Date()
      }
    });

    if (contractCreated) {
      console.log('✅ Contract created and sent by owner.');
    } else {
      console.log('ℹ️ Contract already exists.');
    }

    console.log('🌱 Seeding finished!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();