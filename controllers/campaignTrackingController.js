const Campaign = require('../models/Campaign');
const KPI = require('../models/KPI');
const TargetAudience = require('../models/TargetAudience');
const ContentCalendar = require('../models/ContentCalendar');
const CampaignAIVersion = require('../models/CampaignAIVersion');
const PostAnalytics = require('../models/PostAnalytics');
const { Op } = require('sequelize');

/**
 * Enhanced Campaign Tracking with Smart Analytics
 * Provides comprehensive performance metrics, predictions, and comparisons
 */

// @desc    Get active campaigns with smart tracking analytics
// @route   GET /api/campaigns/active/enhanced
// @access  Private
exports.getActiveCampaignsWithTracking = async (req, res, next) => {
  try {
    const ownerId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;
    const today = new Date();

    // Fetch active campaigns with all related data
    // Active = published + not cancelled/draft/completed + started but not ended
    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where: {
        userId: ownerId,
        isPublished: true,
        lifecycleStage: { [Op.notIn]: ['cancelled', 'draft', 'completed'] },
        startDate: { [Op.lte]: today },
        [Op.or]: [
          { endDate: { [Op.gte]: today } },
          { endDate: null }
        ]
      },
      include: [
        {
          model: KPI,
          as: 'kpis',
          attributes: ['id', 'metric', 'targetValue'],
          required: false
        },
        {
          model: TargetAudience,
          as: 'targetAudience',
          attributes: ['id', 'ageRange', 'gender', 'interests', 'platformsUsed'],
          required: false
        },
        {
          model: ContentCalendar,
          as: 'contentCalendar',
          attributes: ['id', 'day', 'date', 'platform', 'contentType', 'status', 'task'],
          required: false
        },
        {
          model: CampaignAIVersion,
          as: 'aiVersions',
          attributes: ['id', 'versionNumber', 'generatedAt', 'isActive'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Note: PostAnalytics linking requires scheduledPostId in ContentCalendar
    // This column doesn't exist yet, so we skip detailed analytics
    // To enable: add scheduledPostId column to ContentCalendar model
    const analyticsMap = new Map();

    // Process campaigns with smart tracking
    const campaignsWithSmartTracking = campaigns.map(campaignModel => {
      const campaign = campaignModel.toJSON();
      const tracking = calculateSmartTracking(campaign, today, analyticsMap);
      return { ...campaign, tracking };
    });

    res.status(200).json({
      success: true,
      count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
        total: count
      },
      data: campaignsWithSmartTracking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate comprehensive smart tracking metrics
 */
function calculateSmartTracking(campaign, today, analyticsMap) {
  const start = new Date(campaign.startDate || campaign.createdAt);
  const end = campaign.endDate ? new Date(campaign.endDate) : null;
  
  // Duration calculations
  const totalDurationDays = Math.max(1, Number(campaign.campaign_duration_weeks || 1) * 7);
  const elapsedDurationDays = Math.max(0, Math.min(
    totalDurationDays, 
    Math.ceil((today - start) / (1000 * 60 * 60 * 24))
  ));
  const remainingDurationDays = Math.max(0, totalDurationDays - elapsedDurationDays);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDurationDays / totalDurationDays) * 100)));
  
  // Content breakdown
  const calendarItems = Array.isArray(campaign.contentCalendar) ? campaign.contentCalendar : [];
  const postedItems = calendarItems.filter(item => item.status === 'posted');
  const failedItems = calendarItems.filter(item => item.status === 'failed');
  const scheduledItems = calendarItems.filter(item => item.status === 'scheduled');
  
  const postedContentCount = postedItems.length;
  const failedContentCount = failedItems.length;
  const scheduledContentCount = scheduledItems.length;
  const totalContent = calendarItems.length;
  
  // Aggregate actual performance from PostAnalytics
  let actualPerformance = {
    likes: 0,
    comments: 0,
    shares: 0,
    reach: 0,
    impressions: 0,
    engagementRate: 0,
    postsWithData: 0
  };
  
  // Note: Analytics lookup disabled - requires scheduledPostId column in ContentCalendar
  // postedItems.forEach(item => {
  //   const analytics = analyticsMap.get(item.scheduledPostId);
  //   if (analytics) { ... }
  // });
  
  // Calculate engagement rate
  if (actualPerformance.impressions > 0) {
    actualPerformance.engagementRate = ((actualPerformance.likes + actualPerformance.comments + actualPerformance.shares) / actualPerformance.impressions * 100).toFixed(2);
  }
  
  // KPI Target vs Actual comparison
  const kpis = Array.isArray(campaign.kpis) ? campaign.kpis : [];
  const kpiComparison = kpis.map(kpi => {
    const target = parseFloat(kpi.targetValue) || 0;
    let actual = 0;
    let achievement = 0;
    
    switch (kpi.metric) {
      case 'impressions':
        actual = actualPerformance.impressions;
        break;
      case 'reach':
        actual = actualPerformance.reach;
        break;
      case 'engagement_rate':
        actual = parseFloat(actualPerformance.engagementRate);
        break;
      case 'conversions':
        // Would need conversion tracking data
        actual = 0;
        break;
    }
    
    achievement = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
    
    return {
      metric: kpi.metric,
      target,
      actual,
      achievement,
      status: achievement >= 100 ? 'achieved' : achievement >= 75 ? 'on_track' : achievement >= 50 ? 'at_risk' : 'behind'
    };
  });
  
  // Budget calculations
  const budgetAmount = parseFloat(campaign.budget_amount) || 0;
  const budgetBurnRate = progressPercent > 0 ? (progressPercent / 100) : 0;
  const estimatedBudgetUsed = budgetAmount * budgetBurnRate;
  const remainingBudget = budgetAmount - estimatedBudgetUsed;
  
  // Predictive analytics
  const contentCompletionRate = totalContent > 0 ? (postedContentCount / totalContent) : 0;
  const predictedCompletionDate = calculatePredictedCompletion(
    start, 
    totalContent, 
    postedContentCount, 
    elapsedDurationDays
  );
  
  // Trend analysis (mock - would need historical data)
  const trend = {
    direction: contentCompletionRate > (progressPercent / 100) ? 'ahead' : contentCompletionRate < (progressPercent / 100) ? 'behind' : 'on_track',
    velocity: totalContent > 0 ? (postedContentCount / elapsedDurationDays) : 0,
    projectedTotalDays: contentCompletionRate > 0 ? Math.ceil(totalContent / (postedContentCount / elapsedDurationDays)) : totalDurationDays
  };
  
  // Platform breakdown
  const platformStats = {};
  calendarItems.forEach(item => {
    const platform = item.platform || 'Unknown';
    if (!platformStats[platform]) {
      platformStats[platform] = { posted: 0, scheduled: 0, failed: 0, total: 0 };
    }
    platformStats[platform].total++;
    platformStats[platform][item.status]++;
  });
  
  // AI Version info
  const activeAIVersion = Array.isArray(campaign.aiVersions)
    ? campaign.aiVersions.find(v => v.isActive) || null
    : null;
  
  return {
    // Duration tracking
    duration: {
      totalDurationDays,
      elapsedDurationDays,
      remainingDurationDays,
      progressPercent,
      isOverdue: remainingDurationDays === 0 && postedContentCount < totalContent
    },
    
    // Content tracking
    content: {
      totalItems: totalContent,
      postedContentCount,
      scheduledContentCount,
      failedContentCount,
      completionRate: totalContent > 0 ? Math.round((postedContentCount / totalContent) * 100) : 0,
      breakdown: {
        posted: { count: postedContentCount, percent: totalContent > 0 ? Math.round((postedContentCount / totalContent) * 100) : 0 },
        scheduled: { count: scheduledContentCount, percent: totalContent > 0 ? Math.round((scheduledContentCount / totalContent) * 100) : 0 },
        failed: { count: failedContentCount, percent: totalContent > 0 ? Math.round((failedContentCount / totalContent) * 100) : 0 }
      }
    },
    
    // KPI comparison
    kpis: {
      totalKpis: kpis.length,
      metrics: kpis.map(k => k.metric),
      comparison: kpiComparison,
      overallAchievement: kpiComparison.length > 0 
        ? Math.round(kpiComparison.reduce((sum, k) => sum + k.achievement, 0) / kpiComparison.length)
        : 0
    },
    
    // Actual performance
    performance: actualPerformance,
    
    // Budget tracking
    budget: {
      total: budgetAmount,
      estimatedUsed: Math.round(estimatedBudgetUsed),
      remaining: Math.round(remainingBudget),
      burnRate: Math.round(budgetBurnRate * 100),
      dailyBurnRate: elapsedDurationDays > 0 ? Math.round(estimatedBudgetUsed / elapsedDurationDays) : 0
    },
    
    // Platform breakdown
    platforms: platformStats,
    
    // Predictive analytics
    predictions: {
      predictedCompletionDate,
      daysToCompletion: predictedCompletionDate 
        ? Math.ceil((new Date(predictedCompletionDate) - today) / (1000 * 60 * 60 * 24))
        : null,
      onTrack: trend.direction === 'ahead' || trend.direction === 'on_track'
    },
    
    // Trend analysis
    trend,
    
    // AI info
    ai: {
      totalVersions: Array.isArray(campaign.aiVersions) ? campaign.aiVersions.length : 0,
      activeVersion: activeAIVersion
    }
  };
}

/**
 * Calculate predicted completion date based on posting velocity
 */
function calculatePredictedCompletion(startDate, totalContent, postedContent, elapsedDays) {
  if (postedContent === 0 || elapsedDays === 0) return null;
  
  const postingVelocity = postedContent / elapsedDays; // posts per day
  const remainingContent = totalContent - postedContent;
  const daysNeeded = Math.ceil(remainingContent / postingVelocity);
  
  const predictedDate = new Date(startDate);
  predictedDate.setDate(predictedDate.getDate() + elapsedDays + daysNeeded);
  
  return predictedDate.toISOString().split('T')[0];
}

// @desc    Get detailed analytics for a single campaign
// @route   GET /api/campaigns/:id/analytics
// @access  Private
exports.getCampaignAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user?.id;
    
    const campaign = await Campaign.findOne({
      where: { id, userId: ownerId },
      include: [
        {
          model: ContentCalendar,
          as: 'contentCalendar',
          required: false
        },
        {
          model: KPI,
          as: 'kpis',
          required: false
        }
      ]
    });
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    
    // Note: Detailed analytics requires scheduledPostId in ContentCalendar
    // This column doesn't exist yet, so we return basic content stats only
    const postedItems = campaign.contentCalendar?.filter(cc => cc.status === 'posted') || [];
    
    res.status(200).json({
      success: true,
      data: {
        campaignId: id,
        summary: {
          totalPosts: postedItems.length,
          totalEngagement: 0,
          totalReach: 0,
          totalImpressions: 0,
          avgEngagementRate: 0
        },
        dailyTrends: [],
        platformPerformance: {},
        contentTypePerformance: {},
        topPerformingPosts: [],
        recentActivity: []
      }
    });
  } catch (error) {
    next(error);
  }
};

function calculateDailyTrends(postedItems, analytics) {
  const statsByDay = {};
  
  analytics.forEach(a => {
    const date = a.fetchedAt ? new Date(a.fetchedAt).toISOString().split('T')[0] : null;
    if (!date) return;
    
    if (!statsByDay[date]) {
      statsByDay[date] = { likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0, count: 0 };
    }
    
    statsByDay[date].likes += a.likes || 0;
    statsByDay[date].comments += a.comments || 0;
    statsByDay[date].shares += a.shares || 0;
    statsByDay[date].reach += a.reach || 0;
    statsByDay[date].impressions += a.impressions || 0;
    statsByDay[date].count++;
  });
  
  return Object.entries(statsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30) // Last 30 days
    .map(([date, stats]) => ({
      date,
      ...stats,
      engagementRate: stats.impressions > 0 ? ((stats.likes + stats.comments + stats.shares) / stats.impressions * 100).toFixed(2) : 0
    }));
}

function calculatePlatformPerformance(postedItems, analytics) {
  const stats = {};
  
  postedItems.forEach(item => {
    const platform = item.platform || 'Unknown';
    const analyticsItem = analytics.find(a => a.scheduledPostId === item.scheduledPostId);
    
    if (!stats[platform]) {
      stats[platform] = { posts: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 };
    }
    
    stats[platform].posts++;
    if (analyticsItem) {
      stats[platform].likes += analyticsItem.likes || 0;
      stats[platform].comments += analyticsItem.comments || 0;
      stats[platform].shares += analyticsItem.shares || 0;
      stats[platform].reach += analyticsItem.reach || 0;
      stats[platform].impressions += analyticsItem.impressions || 0;
    }
  });
  
  return Object.entries(stats).map(([platform, data]) => ({
    platform,
    ...data,
    avgEngagementPerPost: data.posts > 0 ? Math.round((data.likes + data.comments + data.shares) / data.posts) : 0,
    engagementRate: data.impressions > 0 ? ((data.likes + data.comments + data.shares) / data.impressions * 100).toFixed(2) : 0
  }));
}

function calculateContentTypePerformance(postedItems, analytics) {
  const stats = {};
  
  postedItems.forEach(item => {
    const contentType = item.contentType || 'Unknown';
    const analyticsItem = analytics.find(a => a.scheduledPostId === item.scheduledPostId);
    
    if (!stats[contentType]) {
      stats[contentType] = { posts: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 };
    }
    
    stats[contentType].posts++;
    if (analyticsItem) {
      stats[contentType].likes += analyticsItem.likes || 0;
      stats[contentType].comments += analyticsItem.comments || 0;
      stats[contentType].shares += analyticsItem.shares || 0;
      stats[contentType].reach += analyticsItem.reach || 0;
      stats[contentType].impressions += analyticsItem.impressions || 0;
    }
  });
  
  return Object.entries(stats).map(([type, data]) => ({
    contentType: type,
    ...data,
    avgEngagementPerPost: data.posts > 0 ? Math.round((data.likes + data.comments + data.shares) / data.posts) : 0,
    engagementRate: data.impressions > 0 ? ((data.likes + data.comments + data.shares) / data.impressions * 100).toFixed(2) : 0
  }));
}

function getTopPerformingPosts(postedItems, analytics, limit = 5) {
  const postsWithScores = postedItems.map(item => {
    const a = analytics.find(an => an.scheduledPostId === item.scheduledPostId);
    const score = a ? (a.likes || 0) + (a.comments || 0) * 2 + (a.shares || 0) * 3 : 0;
    return {
      id: item.id,
      platform: item.platform,
      contentType: item.contentType,
      date: item.date,
      score,
      analytics: a ? {
        likes: a.likes,
        comments: a.comments,
        shares: a.shares,
        reach: a.reach,
        impressions: a.impressions
      } : null
    };
  });
  
  return postsWithScores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
