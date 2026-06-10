const { Campaign } = require('../models');
const { Op } = require('sequelize');

/**
 * Campaign Lifecycle Job
 * 
 * This job runs periodically to automatically transition campaign lifecycle stages based on dates:
 * - saved -> active: when startDate is reached
 * - active -> completed: when endDate is reached
 * 
 * Run this job daily (e.g., via cron or node-cron)
 */

async function updateCampaignLifecycle() {
  try {
    console.log('[Campaign Lifecycle Job] Starting...');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate date comparison

    console.log('[Campaign Lifecycle Job] Today:', today.toISOString());

    // 1. Find campaigns with lifecycleStage: 'saved' that should become 'active'
    const savedCampaignsToActivate = await Campaign.findAll({
      where: {
        lifecycleStage: 'saved',
        startDate: {
          [Op.lte]: today
        }
      }
    });

    console.log(`[Campaign Lifecycle Job] Found ${savedCampaignsToActivate.length} saved campaigns to activate`);

    let activatedCount = 0;
    for (const campaign of savedCampaignsToActivate) {
      try {
        await campaign.update({ lifecycleStage: 'active' });
        console.log(`[Campaign Lifecycle Job] Activated campaign ${campaign.id}: ${campaign.campaignName}`);
        activatedCount++;
      } catch (error) {
        console.error(`[Campaign Lifecycle Job] Failed to activate campaign ${campaign.id}:`, error.message);
      }
    }

    // 2. Find campaigns with lifecycleStage: 'active' that should become 'completed'
    const activeCampaignsToComplete = await Campaign.findAll({
      where: {
        lifecycleStage: 'active',
        endDate: {
          [Op.lte]: today
        }
      }
    });

    console.log(`[Campaign Lifecycle Job] Found ${activeCampaignsToComplete.length} active campaigns to complete`);

    let completedCount = 0;
    for (const campaign of activeCampaignsToComplete) {
      try {
        await campaign.update({ lifecycleStage: 'completed' });
        console.log(`[Campaign Lifecycle Job] Completed campaign ${campaign.id}: ${campaign.campaignName}`);
        completedCount++;
      } catch (error) {
        console.error(`[Campaign Lifecycle Job] Failed to complete campaign ${campaign.id}:`, error.message);
      }
    }

    console.log(`[Campaign Lifecycle Job] Completed. Activated: ${activatedCount}, Completed: ${completedCount}`);
    return { activatedCount, completedCount };
  } catch (error) {
    console.error('[Campaign Lifecycle Job] Error:', error);
    throw error;
  }
}

// If run directly, execute the job once
if (require.main === module) {
  updateCampaignLifecycle()
    .then(() => {
      console.log('[Campaign Lifecycle Job] Finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Campaign Lifecycle Job] Failed:', error);
      process.exit(1);
    });
}

module.exports = { updateCampaignLifecycle };
