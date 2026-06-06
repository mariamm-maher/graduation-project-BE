const { sequelize, ScheduledPost, PostAnalytics, KPI, Campaign, Channel } = require('./models');

async function seedDashboardData() {
  try {
    console.log('Starting dashboard data seeding...');

    await sequelize.authenticate();
    console.log('Database connected.');

    // Get all published posts without analytics
    const publishedPosts = await ScheduledPost.findAll({
      where: { status: 'published' },
      include: [
        {
          model: PostAnalytics,
          as: 'postAnalytics',
          required: false
        },
        {
          model: Channel,
          as: 'channel',
          attributes: ['platform']
        }
      ]
    });

    console.log(`Found ${publishedPosts.length} published posts.`);

    // Create PostAnalytics for posts that don't have them
    let analyticsCreated = 0;
    for (const post of publishedPosts) {
      if (!post.postAnalytics) {
        // Generate realistic fake data based on platform
        const platform = post.channel?.platform || 'facebook';
        let likes, comments, shares, reach, impressions;

        switch (platform) {
          case 'instagram':
            likes = Math.floor(Math.random() * 5000) + 500;
            comments = Math.floor(Math.random() * 200) + 20;
            shares = Math.floor(Math.random() * 100) + 10;
            reach = Math.floor(Math.random() * 20000) + 5000;
            impressions = Math.floor(Math.random() * 25000) + 6000;
            break;
          case 'tiktok':
            likes = Math.floor(Math.random() * 50000) + 10000;
            comments = Math.floor(Math.random() * 1000) + 100;
            shares = Math.floor(Math.random() * 500) + 50;
            reach = Math.floor(Math.random() * 100000) + 20000;
            impressions = Math.floor(Math.random() * 150000) + 30000;
            break;
          case 'youtube':
            likes = Math.floor(Math.random() * 10000) + 1000;
            comments = Math.floor(Math.random() * 500) + 50;
            shares = Math.floor(Math.random() * 200) + 20;
            reach = Math.floor(Math.random() * 50000) + 10000;
            impressions = Math.floor(Math.random() * 75000) + 15000;
            break;
          case 'facebook':
          default:
            likes = Math.floor(Math.random() * 3000) + 300;
            comments = Math.floor(Math.random() * 150) + 15;
            shares = Math.floor(Math.random() * 80) + 8;
            reach = Math.floor(Math.random() * 15000) + 3000;
            impressions = Math.floor(Math.random() * 20000) + 4000;
            break;
        }

        await PostAnalytics.create({
          scheduledPostId: post.id,
          likes,
          comments,
          shares,
          reach,
          impressions
        });

        analyticsCreated++;
        console.log(`Created analytics for post ${post.id} (${platform}): ${likes} likes, ${comments} comments`);
      }
    }

    console.log(`Created ${analyticsCreated} PostAnalytics records.`);

    // Add KPI data for campaigns that don't have engagement_rate KPIs
    const campaigns = await Campaign.findAll({
      where: { lifecycleStage: ['active', 'saved', 'draft'] },
      include: [{
        model: KPI,
        as: 'kpis',
        where: { metric: 'engagement_rate' },
        required: false
      }]
    });

    console.log(`Found ${campaigns.length} campaigns.`);

    let kpisCreated = 0;
    for (const campaign of campaigns) {
      const hasEngagementKPI = campaign.kpis && campaign.kpis.length > 0;

      if (!hasEngagementKPI) {
        // Create KPIs for the campaign
        const engagementRate = (Math.random() * 5 + 1).toFixed(2); // 1.00 - 6.00%
        const reach = Math.floor(Math.random() * 100000) + 10000;
        const conversions = Math.floor(Math.random() * 500) + 50;
        const roas = (Math.random() * 5 + 1).toFixed(2); // 1.00 - 6.00

        await KPI.bulkCreate([
          {
            campaignId: campaign.id,
            metric: 'engagement_rate',
            targetValue: engagementRate
          },
          {
            campaignId: campaign.id,
            metric: 'reach',
            targetValue: reach
          },
          {
            campaignId: campaign.id,
            metric: 'conversions',
            targetValue: conversions
          },
          {
            campaignId: campaign.id,
            metric: 'ROAS',
            targetValue: roas
          }
        ]);

        kpisCreated++;
        console.log(`Created KPIs for campaign ${campaign.id}: engagement=${engagementRate}%, reach=${reach}, conversions=${conversions}, ROAS=${roas}`);
      }
    }

    console.log(`Created KPIs for ${kpisCreated} campaigns.`);

    console.log('Dashboard data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding dashboard data:', error);
    process.exit(1);
  }
}

seedDashboardData();
