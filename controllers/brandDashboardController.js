const { sequelize, Campaign, KPI, Collaboration, CollaborationTask, InfluencerProfile, Channel, Notification, User, OwnerProfile, PostAnalytics, ScheduledPost } = require('../models');
const axios = require('axios');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

// Helper function to clamp values
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Helper to map industry to AI enum
const mapIndustryToAIEnum = (industry) => {
  const mapping = {
    'ecommerce': 'E-commerce & Retail',
    'retail': 'E-commerce & Retail',
    'fashion': 'Fashion & Beauty',
    'beauty': 'Fashion & Beauty',
    'food': 'Food & Beverage',
    'beverage': 'Food & Beverage',
    'media': 'Media & Content Creation',
    'content': 'Media & Content Creation',
    'fitness': 'Fitness & Wellness',
    'wellness': 'Fitness & Wellness',
    'health': 'Healthcare & Wellness',
    'home': 'Home & Local Services',
    'local': 'Home & Local Services',
    'education': 'Education & Coaching',
    'coaching': 'Education & Coaching',
    'travel': 'Travel & Hospitality',
    'hospitality': 'Travel & Hospitality',
    'real estate': 'Real Estate',
    'finance': 'Finance & Business',
    'business': 'Finance & Business',
    'technology': 'Technology & Apps',
    'tech': 'Technology & Apps',
    'apps': 'Technology & Apps'
  };
  
  const lowerIndustry = (industry || '').toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (lowerIndustry.includes(key)) {
      return value;
    }
  }
  return 'Other';
};

// Helper to map channels to AI enum
const mapChannelsToAIEnum = (channels) => {
  const validChannels = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Website', 'None'];
  const platformMap = {
    'instagram': 'Instagram',
    'tiktok': 'TikTok',
    'youtube': 'YouTube',
    'facebook': 'Facebook'
  };
  
  return channels
    .map(ch => platformMap[ch.platform?.toLowerCase()] || null)
    .filter(ch => ch && validChannels.includes(ch));
};

// ENDPOINT 1: getDashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    console.log('=== Dashboard Request ===');
    console.log('Authenticated user:', { userId, email: userEmail });

    // Query A — Brand Health Score
    const queryA = (async () => {
      try {
        console.log('Query A: Fetching campaign counts for userId:', userId);
        const totalCampaigns = await Campaign.count({ where: { userId } });
        const completedCampaigns = await Campaign.count({ where: { userId, lifecycleStage: 'completed' } });
        const activeCampaigns = await Campaign.count({ where: { userId, lifecycleStage: 'active' } });
        console.log('Query A: totalCampaigns:', totalCampaigns, 'completed:', completedCampaigns, 'active:', activeCampaigns);
        
        // Get average engagement rate from KPIs
        const campaigns = await Campaign.findAll({
          where: { userId },
          attributes: ['id']
        });
        const campaignIds = campaigns.map(c => c.id);

        const kpiResult = await KPI.findOne({
          attributes: [
            [sequelize.fn('AVG', sequelize.cast(sequelize.col('targetValue'), 'FLOAT')), 'avgEngagement']
          ],
          where: {
            metric: 'engagement_rate',
            campaignId: { [Op.in]: campaignIds }
          }
        });
        const avgEngagement = kpiResult?.dataValues?.avgEngagement || 0;
        
        // Collaboration success rate
        const totalCollabs = await Collaboration.count({ where: { ownerId: userId } });
        const successfulCollabs = await Collaboration.count({
          where: { ownerId: userId, status: { [Op.in]: ['live', 'completed'] } }
        });
        
        // Goal achievement (mock based on KPI targets)
        const kpiGoalHitRate = 0.75; // Mock value
        
        // Calculate score
        const completionRate = totalCampaigns > 0 ? (completedCampaigns / totalCampaigns) * 30 : 0;
        const engagementScore = clamp(avgEngagement * 20, 0, 25);
        const activeRatio = clamp((activeCampaigns / Math.max(totalCampaigns, 1)) * 20, 0, 20);
        const collabSuccess = clamp((successfulCollabs / Math.max(totalCollabs, 1)) * 15, 0, 15);
        const goalAchievement = clamp(kpiGoalHitRate * 10, 0, 10);
        
        const score = Math.round(completionRate + engagementScore + activeRatio + collabSuccess + goalAchievement);
        
        // Determine status
        let status = 'Needs Attention';
        if (score >= 80) status = 'Excellent';
        else if (score >= 60) status = 'Good';
        else if (score >= 40) status = 'Average';
        
        // Trend (mock comparison to previous 30 days)
        const trend = Math.random() > 0.5 ? 'up' : 'down';
        
        return { score, trend, status };
      } catch (err) {
        console.error('Query A error:', err);
        return { score: 50, trend: 'stable', status: 'Average' };
      }
    })();

    // Query B — KPIs
    const queryB = (async () => {
      try {
        const kpis = await KPI.findAll({
          attributes: ['metric', 'targetValue'],
          include: [{
            model: Campaign,
            as: 'campaign',
            where: { userId },
            attributes: []
          }]
        });
        
        let totalReach = 0, engagementRate = 0, totalConversions = 0, campaignROI = 0;
        let reachCount = 0, engagementCount = 0, roiCount = 0;
        
        kpis.forEach(kpi => {
          const value = parseFloat(kpi.targetValue) || 0;
          if (kpi.metric === 'reach') { totalReach += value; reachCount++; }
          if (kpi.metric === 'engagement_rate') { engagementRate += value; engagementCount++; }
          if (kpi.metric === 'conversions') { totalConversions += value; }
          if (kpi.metric === 'ROAS') { campaignROI += value; roiCount++; }
        });
        
        engagementRate = engagementCount > 0 ? engagementRate / engagementCount : 0;
        campaignROI = roiCount > 0 ? campaignROI / roiCount : 0;
        
        const activeCampaigns = await Campaign.count({ where: { userId, lifecycleStage: 'active' } });
        
        // Mock trends
        const trends = {
          totalReach: Math.random() > 0.5 ? '+12%' : '-5%',
          engagementRate: Math.random() > 0.5 ? '+8%' : '-3%',
          totalConversions: Math.random() > 0.5 ? '+15%' : '-2%',
          campaignROI: Math.random() > 0.5 ? '+10%' : '-7%'
        };
        
        return {
          totalReach,
          engagementRate: Math.round(engagementRate * 100) / 100,
          totalConversions,
          campaignROI: Math.round(campaignROI * 100) / 100,
          activeCampaigns,
          trends
        };
      } catch (err) {
        console.error('Query B error:', err);
        return {
          totalReach: 0,
          engagementRate: 0,
          totalConversions: 0,
          campaignROI: 0,
          activeCampaigns: 0,
          trends: { totalReach: '0%', engagementRate: '0%', totalConversions: '0%', campaignROI: '0%' }
        };
      }
    })();

    // Query C — Campaign Progress
    const queryC = (async () => {
      try {
        console.log('Query C: Fetching campaigns for userId:', userId);
        // First try without lifecycleStage filter to see if campaigns exist
        const allCampaigns = await Campaign.findAll({
          where: { userId },
          attributes: ['id', 'campaignName', 'lifecycleStage', 'budget_amount', 'startDate', 'endDate']
        });
        console.log('Query C: Total campaigns for user (no filter):', allCampaigns.length);
        console.log('Query C: Campaign lifecycle stages:', allCampaigns.map(c => c.lifecycleStage));
        
        // Now try with KPI include
        const campaigns = await Campaign.findAll({
          where: { userId },
          include: [{
            model: KPI,
            as: 'kpis',
            attributes: ['metric', 'targetValue']
          }]
        });
        console.log('Query C: Found campaigns with KPIs:', campaigns.length);
        
        return campaigns.map(campaign => {
          const kpis = campaign.kpis || [];
          const numericKpiSum = kpis
            .filter(k => !isNaN(parseFloat(k.targetValue)))
            .reduce((sum, k) => sum + parseFloat(k.targetValue), 0);
          
          const budget = parseFloat(campaign.budget_amount) || 0;
          const spent = numericKpiSum > 0 ? numericKpiSum : budget * 0.6;
          const progress = clamp((spent / Math.max(budget, 1)) * 100, 0, 100);
          
          return {
            id: campaign.id,
            name: campaign.campaignName,
            status: campaign.lifecycleStage,
            budget,
            spent: Math.round(spent * 100) / 100,
            progress: Math.round(progress),
            startDate: campaign.startDate,
            endDate: campaign.endDate
          };
        });
      } catch (err) {
        console.error('Query C error:', err);
        return [];
      }
    })();

    // Query D — Business Goals
    const queryD = (async () => {
      try {
        console.log('Query D: Fetching campaigns with goals for userId:', userId);
        const campaigns = await Campaign.findAll({
          where: {
            userId,
            campaign_goal: { [Op.ne]: null }
          },
          include: [{
            model: KPI,
            as: 'kpis',
            attributes: ['metric', 'targetValue'],
            limit: 1
          }],
          limit: 5
        });
        console.log('Query D: Found campaigns with goals:', campaigns.length);
        
        const goals = {};
        campaigns.forEach(campaign => {
          const goalType = campaign.campaign_goal;
          if (!goals[goalType]) {
            const target = parseFloat(campaign.kpis?.[0]?.targetValue) || 100;
            const progress = 0.75; // Mock progress
            const current = target * progress;
            
            goals[goalType] = {
              name: goalType,
              target,
              current: Math.round(current * 100) / 100,
              percentage: clamp((current / target) * 100, 0, 100)
            };
          }
        });
        
        return Object.values(goals).slice(0, 5);
      } catch (err) {
        console.error('Query D error:', err);
        return [];
      }
    })();

    // Query E — Top Channels
    const queryE = (async () => {
      try {
        const channels = await Channel.findAll({
          where: { userId, status: 'active' },
          include: [{
            model: ScheduledPost,
            as: 'scheduledPosts',
            attributes: ['id', 'status'],
            include: [{
              model: PostAnalytics,
              as: 'postAnalytics',
              attributes: ['likes', 'comments']
            }]
          }]
        });

        return channels.map(channel => {
          let totalLikes = 0, totalComments = 0, postCount = 0;

          channel.scheduledPosts?.forEach(post => {
            if (post.postAnalytics) {
              totalLikes += post.postAnalytics.likes || 0;
              totalComments += post.postAnalytics.comments || 0;
            }
            if (post.status === 'published') postCount++;
          });

          // Followers from channel.platformData
          const pd = channel.platformData || {};

          // Platform-specific follower field names
          let followers = 0;
          if (channel.platform === 'facebook') {
            followers = pd.followers || 0;
          } else if (channel.platform === 'instagram') {
            followers = pd.followerCount || 0;
          } else if (channel.platform === 'youtube') {
            followers = pd.subscriberCount || 0;
          } else if (channel.platform === 'tiktok') {
            followers = pd.followerCount || 0;
          } else {
            // Fallback for other platforms
            followers =
              pd.followers_count         ||
              pd.follower_count          ||
              pd.fans_count              ||
              pd.fan_count               ||
              pd.statistics?.subscriberCount ||
              pd.followersCount          ||
              pd.subscriber_count        ||
              pd.subscriberCount         ||
              pd.followerCount           ||
              0;
          }

          return {
            id: channel.id,
            platform: channel.platform,
            accountName: channel.accountName,
            followers,
            totalLikes,
            totalComments,
            postCount
          };
        }).sort((a, b) => b.followers - a.followers).slice(0, 5);
      } catch (err) {
        console.error('Query E error:', err);
        return [];
      }
    })();

    // Query F — Influencers (all collaborated with owner)
    const queryF = (async () => {
      try {
        console.log('Query F: Fetching collaborators for ownerId:', userId);
        const collaborations = await Collaboration.findAll({
          where: { ownerId: userId },
          include: [
            {
              model: User,
              as: 'influencer',
              include: [{
                model: InfluencerProfile,
                as: 'influencerProfile'
              }]
            },
            {
              model: Campaign,
              as: 'campaign',
              attributes: ['id', 'campaignName']
            }
          ]
        });
        console.log('Query F: Found collaborations:', collaborations.length);
        
        const influencerMap = new Map();
        
        collaborations.forEach(collab => {
          const influencer = collab.influencer;
          if (!influencer) return;
          
          const profile = influencer.influencerProfile;
          if (!influencerMap.has(influencer.id)) {
            influencerMap.set(influencer.id, {
              id: influencer.id,
              name: `${influencer.firstName} ${influencer.lastName}`,
              campaigns: 0,
              reach: parseInt(profile?.followersCount) || 0,
              engagementRate: parseFloat(profile?.engagementRate) || 0,
              collaborations: []
            });
          }
          
          const data = influencerMap.get(influencer.id);
          data.campaigns++;
          data.collaborations.push({
            id: collab.id,
            status: collab.status,
            campaign: collab.campaign
          });
        });
        
        const influencers = Array.from(influencerMap.values());
        console.log('Query F: Unique influencers:', influencers.length);
        
        return influencers;
      } catch (err) {
        console.error('Query F error:', err);
        return [];
      }
    })();

    // Query G — Recent Activity
    const queryG = (async () => {
      try {
        const notifications = await Notification.findAll({
          where: { userId },
          order: [['createdAt', 'DESC']],
          limit: 10
        });
        
        const typeMap = {
          'CAMPAIGN_PUBLISHED': 'Campaign Published',
          'CONTRACT_SIGNED': 'Contract Signed',
          'TASK_APPROVED': 'Task Approved',
          'CHANNEL_CONNECTED': 'Channel Connected',
          'AI_CAMPAIGN_READY': 'AI Campaign Ready'
        };
        
        return notifications.map(notif => ({
          id: notif.id,
          title: typeMap[notif.type] || notif.type,
          description: notif.message,
          timestamp: notif.createdAt,
          status: notif.isRead ? 'read' : 'unread',
          type: notif.type
        }));
      } catch (err) {
        console.error('Query G error:', err);
        return [];
      }
    })();

    // Run all queries in parallel
    const [brandHealth, kpis, campaigns, goals, channels, influencers, recentActivity] = await Promise.all([
      queryA, queryB, queryC, queryD, queryE, queryF, queryG
    ]);

    return sendSuccess(res, 200, 'Dashboard data retrieved successfully', {
      brandHealth,
      kpis,
      campaigns,
      goals,
      channels,
      influencers,
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard endpoint error:', error);
    return next(new AppError(error.message, 500));
  }
};

// ENDPOINT 2: getAIInsights
exports.getAIInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Step 1: Fetch owner's recent data
    let ownerProfile, activeCampaigns, channels, collaborations;
    
    try {
      [ownerProfile, activeCampaigns, channels, collaborations] = await Promise.all([
        OwnerProfile.findOne({ where: { userId } }),
        Campaign.findAll({
          where: { userId, lifecycleStage: 'active' },
          include: [{ model: KPI, as: 'kpis' }],
          limit: 3,
          order: [['createdAt', 'DESC']]
        }),
        Channel.findAll({ where: { userId, status: 'active' } }),
        Collaboration.findAll({ where: { ownerId: userId } })
      ]);
    } catch (dbError) {
      console.error('Database query error in getAIInsights:', dbError);
      // Use empty arrays/null as fallback
      ownerProfile = null;
      activeCampaigns = [];
      channels = [];
      collaborations = [];
    }

    const lastCampaign = activeCampaigns[0];
    const topChannel = channels[0];
    const topInfluencer = collaborations.length > 0 ? collaborations.sort((a, b) => b.id - a.id)[0] : null;

    // Step 2: Build payload for Python AI service
    const targetMarket = Array.isArray(ownerProfile?.target_market) ? ownerProfile.target_market[0] : 'Global';
    const payload = {
      job_id: `insights-${userId}-${Date.now()}`,
      brand_name: ownerProfile?.brand_name || 'Brand',
      product_or_service: ownerProfile?.product_or_service || 'Product',
      industry: mapIndustryToAIEnum(ownerProfile?.industry),
      target_market: targetMarket,
      company_size: ownerProfile?.company_size || 'Small',
      campaign_goal: lastCampaign?.campaign_goal || 'Awareness',
      budget_amount: lastCampaign?.budget_amount || 1000,
      budget_currency: lastCampaign?.budget_currency || 'USD',
      campaign_duration_weeks: lastCampaign?.campaign_duration_weeks || 4,
      unique_selling_point: ownerProfile?.unique_selling_point || '',
      has_previous_campaigns: true,
      current_channels: mapChannelsToAIEnum(channels)
    };

    // Step 3: Call Python AI service
    let insights = [];
    let recommendations = [];

    try {
      const aiResponse = await axios.post('http://localhost:8000/generate', payload, {
        timeout: 10000
      });

      const aiData = aiResponse.data;

      // Extract insights from strategy.kpis
      if (aiData.strategy?.kpis) {
        const topKpis = aiData.strategy.kpis.slice(0, 3);
        topKpis.forEach((kpi, idx) => {
          insights.push({
            id: `kpi-${idx}`,
            type: 'metric',
            message: `${kpi.metric} target: ${kpi.target}`,
            metric: kpi.metric,
            change: null
          });
        });
      }

      // Extract campaign hooks as positive insights
      if (aiData.strategy?.campaign_hooks) {
        const hooks = aiData.strategy.campaign_hooks.slice(0, 2);
        hooks.forEach((hook, idx) => {
          insights.push({
            id: `hook-${idx}`,
            type: 'positive',
            message: hook,
            metric: null,
            change: null
          });
        });
      }

      // Extract content pillars as neutral insight
      if (aiData.strategy?.content_pillars?.[0]) {
        insights.push({
          id: 'pillar-0',
          type: 'neutral',
          message: aiData.strategy.content_pillars[0],
          metric: null,
          change: null
        });
      }

      // Build recommendations from budget allocation
      if (aiData.strategy?.budget_allocation) {
        const allocations = aiData.strategy.budget_allocation;
        const highest = Object.entries(allocations).sort((a, b) => b[1] - a[1])[0];
        if (highest) {
          recommendations.push({
            id: 'rec-1',
            priority: 'high',
            action: `Increase budget allocation to ${highest[0]}`,
            impact: 'high'
          });
        }
      }

      // Build recommendations from funnel
      if (aiData.strategy?.funnel?.awareness_tactics?.[0]) {
        recommendations.push({
          id: 'rec-2',
          priority: 'medium',
          action: aiData.strategy.funnel.awareness_tactics[0],
          impact: 'medium'
        });
      }

      // Build recommendations from content pillars
      if (aiData.strategy?.content_pillars?.[1]) {
        recommendations.push({
          id: 'rec-3',
          priority: 'low',
          action: `Focus on: ${aiData.strategy.content_pillars[1]}`,
          impact: 'low'
        });
      }

    } catch (aiError) {
      // Step 4: Fallback if Python service is unreachable
      console.warn('Python AI service unreachable, using fallback data:', aiError.message);

      insights = [
        {
          id: 'fallback-1',
          type: 'metric',
          message: `You have ${activeCampaigns.length} active campaigns`,
          metric: 'active_campaigns',
          change: null
        },
        {
          id: 'fallback-2',
          type: 'positive',
          message: `Your top channel is ${topChannel?.platform || 'not connected'}`,
          metric: null,
          change: null
        },
        {
          id: 'fallback-3',
          type: 'neutral',
          message: `Collaborating with ${collaborations.length} influencers`,
          metric: null,
          change: null
        }
      ];

      recommendations = [
        {
          id: 'fallback-rec-1',
          priority: 'medium',
          action: 'Connect more social media channels for better reach',
          impact: 'medium'
        },
        {
          id: 'fallback-rec-2',
          priority: 'low',
          action: 'Review campaign performance regularly',
          impact: 'low'
        }
      ];
    }

    // Limit results
    insights = insights.slice(0, 5);
    recommendations = recommendations.slice(0, 4);

    return sendSuccess(res, 200, 'AI insights retrieved successfully', {
      insights,
      recommendations
    });
  } catch (error) {
    console.error('AI Insights endpoint error:', error);
    return next(new AppError(error.message, 500));
  }
};

// ENDPOINT 3: getPerformanceTrend
exports.getPerformanceTrend = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = 'monthly', metric = 'reach' } = req.query;

    // Validate period and metric
    const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
    const validMetrics = ['reach', 'engagement', 'conversions', 'roi', 'clicks'];

    if (!validPeriods.includes(period)) {
      return next(new AppError('Invalid period. Use: daily, weekly, monthly, yearly', 400));
    }
    if (!validMetrics.includes(metric)) {
      return next(new AppError('Invalid metric. Use: reach, engagement, conversions, roi, clicks', 400));
    }

    // Determine date trunc and interval
    let dateTrunc, interval, limit;
    const now = new Date();

    switch (period) {
      case 'daily':
        dateTrunc = 'day';
        interval = '30 days';
        limit = 30;
        break;
      case 'weekly':
        dateTrunc = 'week';
        interval = '12 weeks';
        limit = 12;
        break;
      case 'monthly':
        dateTrunc = 'month';
        interval = '12 months';
        limit = 12;
        break;
      case 'yearly':
        dateTrunc = 'year';
        interval = '3 years';
        limit = 3;
        break;
    }

    // Build query based on metric
    let valueColumn, aggregation;
    switch (metric) {
      case 'reach':
        valueColumn = 'pa."reach"';
        aggregation = 'SUM';
        break;
      case 'engagement':
        valueColumn = '((pa.likes + pa.comments + pa.shares) / NULLIF(pa.impressions, 0)) * 100';
        aggregation = 'AVG';
        break;
      case 'conversions':
        valueColumn = 'CASE WHEN sp.status = \'published\' THEN 1 ELSE 0 END';
        aggregation = 'SUM';
        break;
      case 'roi':
        valueColumn = 'kpi."targetValue"';
        aggregation = 'AVG';
        break;
      case 'clicks':
        valueColumn = 'pa.impressions';
        aggregation = 'SUM';
        break;
    }

    // Build SQL query
    let query;
    if (metric === 'roi') {
      // ROI needs to join with KPI table
      query = `
        SELECT 
          DATE_TRUNC('${dateTrunc}', c."startDate") as label,
          ${aggregation}(${valueColumn}) as value
        FROM "Campaigns" c
        INNER JOIN "KPIs" kpi ON kpi."campaignId" = c.id
        WHERE c."userId" = :userId
          AND kpi.metric = 'ROAS'
          AND c."startDate" >= NOW() - INTERVAL '${interval}'
        GROUP BY label
        ORDER BY label DESC
        LIMIT ${limit}
      `;
    } else {
      // Other metrics use PostAnalytics
      query = `
        SELECT 
          DATE_TRUNC('${dateTrunc}', pa."fetchedAt") as label,
          ${aggregation}(${valueColumn}) as value
        FROM "PostAnalytics" pa
        INNER JOIN "ScheduledPosts" sp ON sp.id = pa."scheduledPostId"
        INNER JOIN "Channels" ch ON ch.id = sp."channelId"
        WHERE ch."userId" = :userId
          AND pa."fetchedAt" >= NOW() - INTERVAL '${interval}'
        GROUP BY label
        ORDER BY label DESC
        LIMIT ${limit}
      `;
    }

    const results = await sequelize.query(query, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    // Format results
    let data = results.map(row => ({
      label: formatLabel(row.label, period),
      value: row.value ? Math.round(row.value * 100) / 100 : 0
    })).reverse();

    // Fallback to synthetic data if no results
    if (data.length === 0) {
      data = await generateSyntheticTrend(userId, period, metric, limit);
    }

    return sendSuccess(res, 200, 'Performance trend retrieved successfully', {
      period,
      metric,
      data
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

// Helper to format date labels
function formatLabel(date, period) {
  const d = new Date(date);
  switch (period) {
    case 'daily':
      return d.toISOString().split('T')[0];
    case 'weekly':
      return `Week ${getWeekNumber(d)}`;
    case 'monthly':
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    case 'yearly':
      return d.getFullYear().toString();
    default:
      return d.toISOString().split('T')[0];
  }
}

// Helper to get week number
function getWeekNumber(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

// Helper to generate synthetic trend data from Campaign KPIs
async function generateSyntheticTrend(userId, period, metric, limit) {
  const campaigns = await Campaign.findAll({
    where: { userId },
    include: [{ model: KPI, as: 'kpis' }],
    order: [['startDate', 'DESC']]
  });

  const data = [];
  const now = new Date();

  for (let i = limit - 1; i >= 0; i--) {
    let label;
    const d = new Date(now);

    switch (period) {
      case 'daily':
        d.setDate(d.getDate() - i);
        label = d.toISOString().split('T')[0];
        break;
      case 'weekly':
        d.setDate(d.getDate() - (i * 7));
        label = `Week ${getWeekNumber(d)}`;
        break;
      case 'monthly':
        d.setMonth(d.getMonth() - i);
        label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() - i);
        label = d.getFullYear().toString();
        break;
    }

    // Generate synthetic value based on campaign KPIs
    let value = 0;
    if (campaigns.length > 0) {
      const campaign = campaigns[i % campaigns.length];
      const kpi = campaign.kpis?.find(k => 
        metric === 'reach' && k.metric === 'reach' ||
        metric === 'engagement' && k.metric === 'engagement_rate' ||
        metric === 'conversions' && k.metric === 'conversions' ||
        metric === 'roi' && k.metric === 'ROAS' ||
        metric === 'clicks' && k.metric === 'impressions'
      );
      
      if (kpi) {
        value = parseFloat(kpi.targetValue) || 0;
        // Add some variation
        value = value * (0.8 + Math.random() * 0.4);
      } else {
        // Default synthetic values
        switch (metric) {
          case 'reach': value = 1000 + Math.random() * 5000; break;
          case 'engagement': value = 2 + Math.random() * 8; break;
          case 'conversions': value = Math.floor(10 + Math.random() * 50); break;
          case 'roi': value = 2 + Math.random() * 5; break;
          case 'clicks': value = 500 + Math.random() * 2000; break;
        }
      }
    } else {
      // No campaigns - use defaults
      switch (metric) {
        case 'reach': value = 1000 + Math.random() * 5000; break;
        case 'engagement': value = 2 + Math.random() * 8; break;
        case 'conversions': value = Math.floor(10 + Math.random() * 50); break;
        case 'roi': value = 2 + Math.random() * 5; break;
        case 'clicks': value = 500 + Math.random() * 2000; break;
      }
    }

    data.push({
      label,
      value: Math.round(value * 100) / 100
    });
  }

  return data;
}

// ENDPOINT 4: getPlatformAnalytics
exports.getPlatformAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { Op } = require('sequelize');

    // 1. Get all connected channels for this owner
    const channels = await Channel.findAll({
      where: { userId, status: 'active' },
    });

    if (!channels.length) {
      return sendSuccess(res, 200, 'No connected platforms', { platforms: [] });
    }

    // 2. For each channel, aggregate PostAnalytics data
    const now   = new Date();
    const d30   = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const d60   = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const platformMap = {};  // keyed by platform name

    for (const channel of channels) {
      const platform = channel.platform; // 'instagram'|'tiktok'|'youtube'|'facebook'

      // Fetch posts + analytics for current period (last 30d)
      const posts = await ScheduledPost.findAll({
        where: {
          channelId: channel.id,
          status:    'published',
          scheduledAt: { [Op.gte]: d30 },
        },
        include: [{
          model:    PostAnalytics,
          as:       'postAnalytics',
          required: false,
        }],
      });

      // Fetch all published posts for total likes/comments (all time)
      const allPosts = await ScheduledPost.findAll({
        where: { channelId: channel.id, status: 'published' },
        include: [{
          model:    PostAnalytics,
          as:       'postAnalytics',
          required: false,
        }],
      });

      const allAnalytics = allPosts
        .map(p => p.postAnalytics)
        .filter(Boolean);

      const totalLikes    = allAnalytics.reduce((s, a) => s + (a.likes    || 0), 0);
      const totalComments = allAnalytics.reduce((s, a) => s + (a.comments || 0), 0);

      // Helper: get post count from posts array
      const currPostCount = posts.length;

      // Content type breakdown from ScheduledPost.content or mediaUrls
      const typeMap = {};
      for (const post of posts) {
        let type = 'Post';
        const urls = post.mediaUrls || [];
        const text = (post.content || '').toLowerCase();
        if (urls.length > 1)        type = 'Carousel';
        else if (text.includes('reel') || text.includes('video')) type = 'Reel';
        else if (text.includes('story')) type = 'Story';

        const analytics = post.postAnalytics;
        const val = analytics
          ? (analytics.reach || analytics.impressions || 0)
          : 0;

        typeMap[type] = (typeMap[type] || 0) + val;
      }

      // Build content_types array sorted descending by value
      const content_types = Object.entries(typeMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

      // Followers: read from channel.platformData if available
      const pd = channel.platformData || {};

      // Platform-specific follower field names
      let followers = 0;
      if (platform === 'facebook') {
        followers = pd.followers || 0;
      } else if (platform === 'instagram') {
        followers = pd.followerCount || 0;
      } else if (platform === 'youtube') {
        followers = pd.subscriberCount || 0;
      } else if (platform === 'tiktok') {
        followers = pd.followerCount || 0;
      } else {
        // Fallback for other platforms
        followers =
          pd.followers_count         ||
          pd.follower_count          ||
          pd.fans_count              ||
          pd.fan_count               ||
          pd.statistics?.subscriberCount ||
          pd.followersCount          ||
          pd.subscriber_count        ||
          pd.subscriberCount         ||
          pd.followerCount           ||
          0;
      }

      const followerTrend = null; // no historical follower data in current schema

      // Merge into platformMap (same platform may have multiple channels)
      if (!platformMap[platform]) {
        platformMap[platform] = {
          platform,
          accountName:   channel.accountName || channel.accountUsername || platform,
          followers,
          followerTrend: null,
          totalLikes,
          totalComments,
          content_types,
          postCount:     currPostCount,
        };
      } else {
        // Accumulate if owner has multiple accounts on same platform
        const ex = platformMap[platform];
        ex.totalLikes    += totalLikes;
        ex.totalComments += totalComments;
        ex.postCount    += currPostCount;
        // followers: take the larger value (main account)
        ex.followers = Math.max(ex.followers, followers);
        // Merge content_types
        for (const ct of content_types) {
          const found = ex.content_types.find(e => e.label === ct.label);
          if (found) found.value += ct.value;
          else ex.content_types.push(ct);
        }
        ex.content_types.sort((a, b) => b.value - a.value);
      }
    }

    // 3. Format final response
    const platforms = Object.values(platformMap).map(p => ({
      ...p,
      // Format large numbers for display
      followersFormatted:     _fmtNum(p.followers),
      totalLikesFormatted:    _fmtNum(p.totalLikes),
      totalCommentsFormatted: _fmtNum(p.totalComments),
    }));

    return sendSuccess(res, 200, 'Platform analytics fetched', { platforms });

  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Private number formatter
function _fmtNum(v = 0) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000)    return (v / 1000).toFixed(1) + 'K';
  return Math.round(v).toString();
}
