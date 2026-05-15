/**
 * Campaign Tracking Test Data Seeder
 * 
 * Seeds campaigns with realistic tracking scenarios:
 * - On-track campaigns with good progress
 * - At-risk campaigns falling behind
 * - High-performing campaigns exceeding targets
 * - Completed campaigns with full history
 * 
 * Includes: Campaigns, KPIs, TargetAudience, ContentCalendar, PostAnalytics
 */

const trackingTestCampaigns = require('./data');

async function seedTrackingCampaigns(models, ownerEmail) {
  console.log('Seeding tracking test campaigns...');
  console.log('Models received:', Object.keys(models || {}));
  
  const { Campaign, KPI, TargetAudience, ContentCalendar, PostAnalytics, User } = models || {};
  
  // Validate models are passed correctly
  if (!KPI || !TargetAudience || !ContentCalendar || !PostAnalytics) {
    console.error('ERROR: Required models not found:', { 
      hasKPI: !!KPI, 
      hasTargetAudience: !!TargetAudience, 
      hasContentCalendar: !!ContentCalendar, 
      hasPostAnalytics: !!PostAnalytics,
      hasCampaign: !!Campaign,
      hasUser: !!User
    });
    return;
  }
  
  // Find owner user
  const owner = await User.findOne({ where: { email: ownerEmail } });
  if (!owner) {
    console.log(`SKIPPED tracking campaigns: owner ${ownerEmail} not found.`);
    return;
  }
  
  let seededCount = 0;
  let analyticsCount = 0;
  
  for (const seed of trackingTestCampaigns) {
    // Skip if not matching the owner email
    if (seed.ownerEmail !== ownerEmail) continue;
    
    try {
      // Check if campaign already exists (by key in campaignName)
      const existingCampaign = await Campaign.findOne({
        where: { 
          userId: owner.id,
          campaignName: seed.campaign.campaignName 
        }
      });
      
      if (existingCampaign) {
        console.log(`  SKIPPED: Campaign "${seed.campaign.campaignName}" already exists.`);
        continue;
      }
      
      // Create campaign
      const campaign = await Campaign.create({
        userId: owner.id,
        ...seed.campaign
      });
      
      // Create Target Audience
      if (seed.targetAudience) {
        await TargetAudience.create({
          campaignId: campaign.id,
          ...seed.targetAudience
        });
      }
      
      // Create KPIs
      if (seed.kpis && seed.kpis.length > 0) {
        await KPI.bulkCreate(
          seed.kpis.map(kpi => ({
            campaignId: campaign.id,
            ...kpi
          }))
        );
      }
      
      // Create Content Calendar and track scheduledPostIds
      const scheduledPostIdMap = new Map(); // localId -> scheduledPostId
      let nextPostId = seed.key === 'on-track-campaign' ? 101 : 
                       seed.key === 'at-risk-campaign' ? 201 :
                       seed.key === 'high-performing-campaign' ? 301 : 401;
      
      if (seed.contentCalendar && seed.contentCalendar.length > 0) {
        const contentItems = seed.contentCalendar.map((item, index) => {
          const localId = item.scheduledPostId;
          const actualPostId = item.status === 'posted' ? nextPostId++ : null;
          
          if (localId && actualPostId) {
            scheduledPostIdMap.set(localId, actualPostId);
          }
          
          return {
            campaignId: campaign.id,
            day: item.day,
            date: item.date,
            platform: item.platform,
            contentType: item.contentType,
            caption: item.caption,
            mediaUrl: item.mediaUrl,
            task: item.task,
            status: item.status,
            scheduledPostId: actualPostId,
          };
        });
        
        await ContentCalendar.bulkCreate(contentItems);
      }
      
      // Create Post Analytics for posted content
      if (seed.postAnalytics && scheduledPostIdMap.size > 0) {
        const analyticsData = [];
        
        for (const [localId, analytics] of Object.entries(seed.postAnalytics)) {
          const scheduledPostId = scheduledPostIdMap.get(parseInt(localId));
          
          if (scheduledPostId) {
            analyticsData.push({
              scheduledPostId: scheduledPostId,
              likes: analytics.likes || 0,
              comments: analytics.comments || 0,
              shares: analytics.shares || 0,
              reach: analytics.reach || 0,
              impressions: analytics.impressions || 0,
              fetchedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
            });
          }
        }
        
        if (analyticsData.length > 0) {
          await PostAnalytics.bulkCreate(analyticsData);
          analyticsCount += analyticsData.length;
        }
      }
      
      console.log(`  ✓ Created: "${seed.campaign.campaignName}" (ID: ${campaign.id})`);
      seededCount++;
      
    } catch (error) {
      console.error(`  ✗ Failed to seed "${seed.campaign.campaignName}":`, error.message);
    }
  }
  
  console.log(`Seeded ${seededCount} tracking test campaigns with ${analyticsCount} post analytics.`);
  return { seededCount, analyticsCount };
}

module.exports = { seedTrackingCampaigns, trackingTestCampaigns };
