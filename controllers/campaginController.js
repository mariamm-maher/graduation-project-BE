const Campaign = require('../models/Campaign');
const KPI = require('../models/KPI');
const TargetAudience = require('../models/TargetAudience');
const ContentCalendar = require('../models/ContentCalendar');
const CampaignAIVersion = require('../models/CampaignAIVersion');
const { generateCampaignWithAI } = require('../services/campaignAIService');
const {
  persistCampaignAi,
  formatCampaignWithRelations
} = require('../services/campaignPersistenceService');
const { logAction } = require('../services/logServices');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');
const sendSuccess = require('../utils/sendSuccess');

const CAMPAIGN_GOALS = new Set([
  'Awareness',
  'Leads',
  'Sales',
  'Retention',
  'Re-engagement',
  'Engagement',
  'Traffic',
]);
const TARGET_AUDIENCE_GENDERS = new Set(['all', 'male', 'female', 'custom']);
const KPI_METRICS = new Set(['impressions', 'reach', 'engagement_rate', 'conversions', 'ROAS', 'CPA', 'CTR']);
const CONTENT_TYPES = new Set(['video', 'carousel', 'story', 'reel', 'post', 'article']);
const CONTENT_STATUSES = new Set(['scheduled', 'posted', 'failed']);

const resolveCampaignGoal = (payload = {}) => payload.goalType || payload.campaign_goal;

const resolveBudgetAmount = (payload = {}) => {
  if (payload.totalBudget !== undefined && payload.totalBudget !== null) return payload.totalBudget;
  if (payload.budget_amount !== undefined && payload.budget_amount !== null) return payload.budget_amount;
  return null;
};

const resolveCurrency = (payload = {}) => payload.currency || payload.budget_currency || null;

const resolveDurationWeeks = (payload = {}) => {
  if (payload.campaign_duration_weeks === undefined || payload.campaign_duration_weeks === null || payload.campaign_duration_weeks === '') {
    return null;
  }
  const parsed = Number(payload.campaign_duration_weeks);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
};

const resolveDate = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildAndValidateCampaignCore = (body = {}) => {
  const campaignName = body.campaignName;
  const campaign_goal = resolveCampaignGoal(body);
  const budget_amount = resolveBudgetAmount(body);
  const budget_currency = resolveCurrency(body);
  const campaign_duration_weeks = resolveDurationWeeks(body);

  if (!campaignName || !campaign_goal || budget_amount === null || budget_amount === undefined || !budget_currency) {
    throw new AppError('Please provide all required fields', 400);
  }

  const normalizedBudget = Number(budget_amount);
  if (!Number.isFinite(normalizedBudget) || normalizedBudget <= 0) {
    throw new AppError('Budget must be greater than 0', 400);
  }

  if (!CAMPAIGN_GOALS.has(campaign_goal)) {
    throw new AppError('Invalid campaign_goal value', 400);
  }

  if (campaign_duration_weeks === null || campaign_duration_weeks < 1) {
    throw new AppError('campaign_duration_weeks must be greater than or equal to 1', 400);
  }

  return {
    campaignName,
    campaign_goal,
    budget_amount: normalizedBudget,
    budget_currency,
    campaign_duration_weeks,
    startDate: resolveDate(body.startDate),
    endDate: resolveDate(body.endDate)
  };
};



const buildCampaignPayload = ({ body, userId, status, isPublished }) => {
  const campaignData = buildAndValidateCampaignCore(body);

  return {
    userId,
    ...campaignData,
    status,
    isPublished,
  };
};

const createCampaignRelations = async ({ campaignId, targetAudience, kpis, contentCalendar, transaction }) => {
  if (targetAudience) {
    if (!TARGET_AUDIENCE_GENDERS.has(targetAudience.gender)) {
      throw new AppError('Invalid targetAudience.gender value', 400);
    }

    if (!Array.isArray(targetAudience.interests) || !Array.isArray(targetAudience.platformsUsed)) {
      throw new AppError('targetAudience.interests and targetAudience.platformsUsed must be arrays', 400);
    }

    await TargetAudience.create({
      campaignId,
      ageRange: targetAudience.ageRange,
      gender: targetAudience.gender,
      interests: targetAudience.interests,
      platformsUsed: targetAudience.platformsUsed
    }, { transaction });
  }

  if (Array.isArray(kpis)) {
    for (const kpi of kpis) {
      if (!KPI_METRICS.has(kpi.metric)) {
        throw new AppError(`Invalid KPI metric: ${kpi.metric}`, 400);
      }

      await KPI.create({
        campaignId,
        metric: kpi.metric,
        targetValue: kpi.targetValue
      }, { transaction });
    }
  }

  if (Array.isArray(contentCalendar)) {
    for (const content of contentCalendar) {
      const status = content.status || 'scheduled';
      const contentDate = resolveDate(content.date);

      if (!CONTENT_TYPES.has(content.contentType)) {
        throw new AppError(`Invalid contentType: ${content.contentType}`, 400);
      }

      if (!CONTENT_STATUSES.has(status)) {
        throw new AppError(`Invalid content status: ${status}`, 400);
      }

      if (!Number.isInteger(Number(content.day))) {
        throw new AppError('ContentCalendar day must be an integer', 400);
      }

      if (!contentDate) {
        throw new AppError('Invalid ContentCalendar date value', 400);
      }

      await ContentCalendar.create({
        campaignId,
        day: Number(content.day),
        date: contentDate,
        platform: content.platform,
        contentType: content.contentType,
        caption: content.caption,
        mediaUrl: content.mediaUrl,
        task: content.task,
        status
      }, { transaction });
    }
  }

};

/** Load campaign + relational data for consistent API responses */
const loadCampaignDetail = async (campaignId, userId) => {
  return Campaign.findOne({
    where: { id: campaignId, userId },
    attributes: [
      'id',
      'campaignName',
      'status',
      'campaign_goal',
      'budget_amount',
      'budget_currency',
      'campaign_duration_weeks',
      'startDate',
      'endDate',
      'isPublished',
      'createdAt',
      'updatedAt',
    ],
    include: [
      {
        model: TargetAudience,
        as: 'targetAudience',
        attributes: ['id', 'ageRange', 'gender', 'interests', 'platformsUsed'],
      },
      {
        model: KPI,
        as: 'kpis',
        attributes: ['id', 'metric', 'targetValue'],
      },
      {
        model: ContentCalendar,
        as: 'contentCalendar',
        attributes: [
          'id',
          'day',
          'date',
          'platform',
          'contentType',
          'caption',
          'mediaUrl',
          'task',
          'status',
        ],
      },
      {
        model: CampaignAIVersion,
        as: 'aiVersions',
        attributes: [
          'id',
          'versionNumber',
          'generatedAt',
          'strategy',
          'calendar',
          'influencer_matches',
          'influencer_strategy_note',
          'influencer_stage_skipped',
          'isActive',
        ],
      },
    ],
    order: [
      [{ model: KPI, as: 'kpis' }, 'id', 'ASC'],
      [{ model: ContentCalendar, as: 'contentCalendar' }, 'day', 'ASC'],
      [{ model: ContentCalendar, as: 'contentCalendar' }, 'id', 'ASC'],
      [{ model: CampaignAIVersion, as: 'aiVersions' }, 'versionNumber', 'DESC'],
    ],
  });
};

const campaignResponse = (campaign) => ({
  id: campaign.id,
  campaignName: campaign.campaignName,
  status: campaign.status,
  isPublished: campaign.isPublished,
  userId: campaign.userId,
  campaign_goal: campaign.campaign_goal,
  budget_amount: campaign.budget_amount,
  budget_currency: campaign.budget_currency,
  campaign_duration_weeks: campaign.campaign_duration_weeks,
  startDate: campaign.startDate,
  endDate: campaign.endDate,
  createdAt: campaign.createdAt,
  updatedAt: campaign.updatedAt
});

// @desc    Generate AI campaign draft
// @route   POST /api/campaigns/ai/generate
// @access  Private
exports.generateAICampaign = async (req, res, next) => {
  try {
    const {
      campaignName, 
      startDate,
      endDate,
      brand_name,
      product_or_service,
      industry,
      target_market,
      company_size,
      unique_selling_point,
      current_channels,
      competitors,
      has_previous_campaigns,
      previous_campaign_description,
      website,
      platforms,
      campaign_duration_weeks,
       budget_amount,
       campaign_goal,
       budget_currency,
    } = req.body;

   
    const resolvedGoal = resolveCampaignGoal(req.body);
    const resolvedBudget = resolveBudgetAmount(req.body);
    const resolvedCurrency = resolveCurrency(req.body);

  

    let start = null;
    let end = null;
    if (startDate && endDate) {
      // Keep date validation when dates are provided by the client.
      start = new Date(startDate);
      end = new Date(endDate);
      if (start >= end) {
        return next(new AppError('End date must be after start date', 400));
      }
    }

    // Validate budget
    if (Number(resolvedBudget) <= 0) {
      return next(new AppError('Budget must be greater than 0', 400));
    }

    // Prepare data for AI service (do NOT persist to DB)
    const durationWeeks = resolveDurationWeeks(req.body);
    const campaignData = {
      campaignId: null,
      userId: req.user?.id || null,
      campaignName,
      // Basic brand / product info
      brand_name,
      product_or_service,
      industry,
      target_market,
      company_size,
      // Goal / budget
      campaign_goal: resolvedGoal,
      totalBudget: resolvedBudget,
      budget_amount: resolvedBudget,
      currency: resolvedCurrency,
      budget_currency: resolvedCurrency,
      // Dates / duration
      startDate: start,
      endDate: end,
      campaign_duration_weeks: durationWeeks,
      // Creative/context
      unique_selling_point,
      current_channels,
      competitors,
      has_previous_campaigns,
      previous_campaign_description,
      website,
      platforms,
      status: 'draft',
      isPublished: false
    };

    // Generate AI campaign preview
    const aiGeneratedCampaign = await generateCampaignWithAI(campaignData);

    if (req.user?.id) {
      try {
        await notificationService.createNotification({
          userId: req.user.id,
          type: 'AI_CAMPAIGN_READY',
          message: `AI campaign draft is ready for "${campaignName}"`,
          entityType: 'Campaign',
          entityId: null,
          metadata: {
            campaignName,
            goalType: resolvedGoal
          }
        });
      } catch (notifError) {
        console.error('Failed to send AI_CAMPAIGN_READY notification:', notifError);
      }
    }

    sendSuccess(res, 201, 'AI campaign draft generated successfully.', {
     
      aiPreview: aiGeneratedCampaign
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save AI preview or manual campaign as draft with all relations
// @route   POST /api/campaigns/draft
// @access  Private
exports.draftCampaign = async (req, res, next) => {
  try {
    const {
      targetAudience,
      kpis,
      contentCalendar,
      aiVersion
    } = req.body;

    const payload = buildCampaignPayload({
      body: req.body,
      userId: req.user?.id || 1,
      status: 'draft',
      isPublished: false
    });

    let campaign;
    await Campaign.sequelize.transaction(async (t) => {
      // Create campaign as draft (unpublished)
      campaign = await Campaign.create(
        payload,
        { transaction: t }
      );

      await createCampaignRelations({
        campaignId: campaign.id,
        targetAudience,
        kpis,
        contentCalendar,
        transaction: t,
      });

      await persistCampaignAi({ campaignId: campaign.id, body: req.body, transaction: t });
    });

    const full = await loadCampaignDetail(campaign.id, req.user.id);
    sendSuccess(res, 201, 'Campaign draft saved successfully.', {
      campaign: formatCampaignWithRelations(full),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save and publish campaign in one step with all relations
// @route   POST /api/campaigns/save-and-publish
// @access  Private
exports.saveAndPublish = async (req, res, next) => {
  try {
    const {
      targetAudience,
      kpis,
      contentCalendar,
      aiVersion
    } = req.body;

    const payload = buildCampaignPayload({
      body: req.body,
      userId: req.user?.id || 1,
      status: 'active',
      isPublished: true
    });

    let campaign;
    await Campaign.sequelize.transaction(async (t) => {
      // Create and immediately publish campaign
      campaign = await Campaign.create(
        payload,
        { transaction: t }
      );

      await createCampaignRelations({
        campaignId: campaign.id,
        targetAudience,
        kpis,
        contentCalendar,
        transaction: t,
      });

      await persistCampaignAi({ campaignId: campaign.id, body: req.body, transaction: t });

      // Log campaign creation (finalization)
      try {
        await logAction({ 
          req, 
          action: 'CREATE_CAMPAIGN', 
          entity: 'Campaign', 
          entityId: campaign.id, 
          meta: { campaignName: campaign.campaignName, userId: campaign.userId, published: true } 
        });
      } catch (e) {
        // Log error but don't fail the request
      }
    });

    try {
      await notificationService.createNotification({
        userId: campaign.userId,
        type: 'CAMPAIGN_PUBLISHED',
        message: `Campaign "${campaign.campaignName}" was published`,
        entityType: 'Campaign',
        entityId: campaign.id,
        metadata: {
          status: campaign.status,
        }
      });
    } catch (notifError) {
      console.error('Failed to send CAMPAIGN_PUBLISHED notification:', notifError);
    }

    const full = await loadCampaignDetail(campaign.id, req.user.id);
    sendSuccess(res, 201, 'Campaign saved and published successfully.', {
      campaign: formatCampaignWithRelations(full),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save campaign with all relations
// @route   POST /api/campaigns/save
// @access  Private
exports.saveCampaign = async (req, res, next) => {
  try {
    const {
      targetAudience,
      kpis,
      contentCalendar,
      aiVersion,
      isPublished
    } = req.body;

    const payload = buildCampaignPayload({
      body: req.body,
      userId: req.user?.id || 1,
      status: 'active',
      isPublished: isPublished !== undefined ? isPublished : false
    });

    let campaign;
    await Campaign.sequelize.transaction(async (t) => {
      // Create campaign with saved stage (do NOT publish by default)
      campaign = await Campaign.create(
        payload,
        { transaction: t }
      );

      await createCampaignRelations({
        campaignId: campaign.id,
        targetAudience,
        kpis,
        contentCalendar,
        transaction: t,
      });

      await persistCampaignAi({ campaignId: campaign.id, body: req.body, transaction: t });

      // Log campaign creation (finalization)
      try {
        await logAction({ 
          req, 
          action: 'CREATE_CAMPAIGN', 
          entity: 'Campaign', 
          entityId: campaign.id, 
          meta: { campaignName: campaign.campaignName, userId: campaign.userId, published: campaign.isPublished } 
        });
      } catch (e) {
        // Log error but don't fail the request
      }
    });

    if (campaign.isPublished) {
      try {
        await notificationService.createNotification({
          userId: campaign.userId,
          type: 'CAMPAIGN_PUBLISHED',
          message: `Campaign "${campaign.campaignName}" was published`,
          entityType: 'Campaign',
          entityId: campaign.id,
          metadata: {
            status: campaign.status,
          }
        });
      } catch (notifError) {
        console.error('Failed to send CAMPAIGN_PUBLISHED notification:', notifError);
      }
    }

    const full = await loadCampaignDetail(campaign.id, req.user.id);
    sendSuccess(res, 201, 'Campaign saved successfully.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a saved campaign
// @route   POST /api/campaigns/:id/complete
// @access  Private
exports.completeCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    // Check ownership
    if (campaign.userId !== req.user?.id) {
      return next(new AppError('Not authorized to complete this campaign', 403));
    }

    if (campaign.status !== 'active') {
      return next(new AppError('Only active campaigns can be completed', 400));
    }

    campaign.status = 'completed';
    await campaign.save();

    try {
      await notificationService.createNotification({
        userId: campaign.userId,
        type: 'CAMPAIGN_APPROVED',
        message: `Campaign "${campaign.campaignName}" is marked as completed`,
        entityType: 'Campaign',
        entityId: campaign.id,
        metadata: {
            status: campaign.status 
        }
      });
    } catch (notifError) {
      console.error('Failed to send CAMPAIGN_APPROVED notification:', notifError);
    }

    sendSuccess(res, 200, 'Campaign completed successfully.', {
      campaign: {
        id: campaign.id,
        campaignName: campaign.campaignName,
        status: campaign.status,
        updatedAt: campaign.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a campaign
// @route   POST /api/campaigns/:id/cancel
// @access  Private
exports.cancelCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    // Check ownership
    if (campaign.userId !== req.user?.id) {
      return next(new AppError('Not authorized to cancel this campaign', 403));
    }

    // Cannot cancel completed campaigns
    if (campaign.status === 'completed') {
      return next(new AppError('Completed campaigns cannot be cancelled', 400));
    }

    campaign.status = 'cancelled';
    await campaign.save();

    try {
      await notificationService.createNotification({
        userId: campaign.userId,
        type: 'CAMPAIGN_REJECTED',
        message: `Campaign "${campaign.campaignName}" was cancelled`,
        entityType: 'Campaign',
        entityId: campaign.id,
        metadata: {
          status: campaign.status
        }
      });
    } catch (notifError) {
      console.error('Failed to send CAMPAIGN_REJECTED notification:', notifError);
    }

    sendSuccess(res, 200, 'Campaign cancelled successfully.', {
      campaign: {
        id: campaign.id,
        campaignName: campaign.campaignName,
        status: campaign.status,
        updatedAt: campaign.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all campaigns for authenticated user
// @route   GET /api/campaigns
// @access  Private
exports.getCampaigns = async (req, res, next) => {
  try {
    const ownerId = req.user && req.user.id;
    const { page = 1, limit = 10, status, goalType, search } = req.query;
    const offset = (page - 1) * limit;
    const { Op } = require('sequelize');

    // Build where clause for owner's campaigns
    const whereClause = { userId: ownerId };
    if (status) whereClause.status = status;
    if (goalType) {
      whereClause.campaign_goal = goalType;
    }
    if (search) {
      whereClause.campaignName = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'campaignName',
        'status',
        'campaign_goal',
        'budget_amount',
        'budget_currency',
        'campaign_duration_weeks',
        'startDate',
        'endDate',
        'isPublished',
        'createdAt',
        'updatedAt'
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Return compatibility aliases expected by older clients.
    const campaignsWithExtras = campaigns.map(c => {
      const camp = c && typeof c.toJSON === 'function' ? c.toJSON() : c;
      const goals = camp.campaign_goal || null;
      const duration = camp.campaign_duration_weeks ? camp.campaign_duration_weeks * 7 : null;
      return {
        ...camp,
        goalType: goals,
        goals,
        duration
      };
    });

    sendSuccess(res, 200, 'Campaigns retrieved successfully', {
      campaigns: campaignsWithExtras,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overview for authenticated user's campaigns
// @route   GET /api/campaigns/overview
// @access  Private
exports.getCampaignsOverview = async (req, res, next) => {
  try {
    const ownerId = req.user && req.user.id;

    if (!ownerId) {
      return sendSuccess(res, 200, 'Overview retrieved successfully', {
        totalCampaigns: 0,
        totalDraft: 0,
        totalSaved: 0,
        recentCampaigns: []
      });
    }

    const totalCampaigns = await Campaign.count({ where: { userId: ownerId } });
    const totalDraft = await Campaign.count({ where: { userId: ownerId, status: 'draft' } });

    const recent = await Campaign.findAll({
      where: { userId: ownerId },
      attributes: [
        'id',
        'campaignName',
        'status',
        'campaign_goal',
        'budget_amount',
        'budget_currency',
        'campaign_duration_weeks',
        'startDate',
        'endDate',
        'isPublished',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: 2
    });

    const recentWithExtras = recent.map(c => {
      const camp = c && typeof c.toJSON === 'function' ? c.toJSON() : c;
      const goals = camp.campaign_goal || null;
      const duration = camp.campaign_duration_weeks ? camp.campaign_duration_weeks * 7 : null;
      return {
        ...camp,
        goalType: goals,
        goals,
        duration
      };
    });

    sendSuccess(res, 200, 'Overview retrieved successfully', {
      totalCampaigns,
      totalDraft,
      totalSaved: totalDraft,
      recentCampaigns: recentWithExtras
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics insights for authenticated owner's campaigns
// @route   GET /api/campaigns/analytics
// @access  Private
exports.getCampaignAnalytics = async (req, res, next) => {
  try {
    const ownerId = req.user && req.user.id;
    const today = new Date();

    if (!ownerId) {
      return sendSuccess(res, 200, 'Campaign analytics retrieved successfully', {
        summary: {
          totalCampaigns: 0,
          activeCampaigns: 0,
          completedCampaigns: 0,
          cancelledCampaigns: 0,
          publishedCampaigns: 0
        },
        budget: {
          totalBudget: 0,
          averageBudget: 0,
          minBudget: 0,
          maxBudget: 0,
          byCurrency: {}
        },
        lifecycle: {
          byStage: {},
          publicationRatePercent: 0,
          completionRatePercent: 0,
          cancellationRatePercent: 0
        },
        goals: {
          byGoal: {},
          topGoal: null
        },
        duration: {
          averageWeeks: 0,
          totalWeeks: 0,
          runningCampaigns: 0,
          upcomingCampaigns: 0,
          endedCampaigns: 0
        },
        kpis: {
          totalKpis: 0,
          byMetric: {},
          mostUsedMetric: null
        },
        content: {
          totalItems: 0,
          byStatus: {},
          byType: {},
          byPlatform: {},
          postingCompletionPercent: 0
        },
        ai: {
          campaignsWithAIVersion: 0,
          aiAdoptionRatePercent: 0,
          totalVersions: 0,
          activeVersions: 0,
          averageVersionsPerCampaign: 0
        },
        timeline: {
          campaignsByMonth: {}
        }
      });
    }

    const campaigns = await Campaign.findAll({
      where: { userId: ownerId },
      attributes: [
        'id',
        'campaignName',
        'status',
        'campaign_goal',
        'budget_amount',
        'budget_currency',
        'campaign_duration_weeks',
        'startDate',
        'endDate',
        'isPublished',
        'createdAt'
      ],
      include: [
        {
          model: KPI,
          as: 'kpis',
          attributes: ['id', 'metric'],
          required: false
        },
        {
          model: ContentCalendar,
          as: 'contentCalendar',
          attributes: ['id', 'status', 'contentType', 'platform'],
          required: false
        },
        {
          model: CampaignAIVersion,
          as: 'aiVersions',
          attributes: ['id', 'isActive'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const rows = campaigns.map((c) => (typeof c.toJSON === 'function' ? c.toJSON() : c));
    const totalCampaigns = rows.length;

    const lifecycleByStage = {};
    const goalsByType = {};
    const budgetByCurrency = {};
    const kpisByMetric = {};
    const contentByStatus = {};
    const contentByType = {};
    const contentByPlatform = {};
    const campaignsByMonth = {};

    let publishedCampaigns = 0;
    let completedCampaigns = 0;
    let cancelledCampaigns = 0;
    let runningCampaigns = 0;
    let upcomingCampaigns = 0;
    let endedCampaigns = 0;

    let totalBudget = 0;
    let minBudget = Number.POSITIVE_INFINITY;
    let maxBudget = 0;

    let totalWeeks = 0;
    let totalKpis = 0;
    let totalContentItems = 0;
    let postedContentCount = 0;

    let campaignsWithAIVersion = 0;
    let totalAIVersions = 0;
    let activeAIVersions = 0;

    for (const campaign of rows) {
      const stage = campaign.status || 'unknown';
      statusByStage[stage] = (statusByStage[stage] || 0) + 1;

      if (campaign.isPublished) publishedCampaigns += 1;
      if (campaign.status === 'completed') completedCampaigns += 1;
      if (campaign.status === 'cancelled') cancelledCampaigns += 1;

      const goal = campaign.campaign_goal || 'unknown';
      goalsByType[goal] = (goalsByType[goal] || 0) + 1;

      const budget = Number(campaign.budget_amount || 0);
      if (Number.isFinite(budget) && budget > 0) {
        totalBudget += budget;
        minBudget = Math.min(minBudget, budget);
        maxBudget = Math.max(maxBudget, budget);

        const curr = campaign.budget_currency || 'unknown';
        budgetByCurrency[curr] = (budgetByCurrency[curr] || 0) + budget;
      }

      const weeks = Number(campaign.campaign_duration_weeks || 0);
      if (Number.isFinite(weeks) && weeks > 0) totalWeeks += weeks;

      const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
      const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
      const hasValidStart = startDate && !Number.isNaN(startDate.getTime());
      const hasValidEnd = endDate && !Number.isNaN(endDate.getTime());

      if (hasValidStart && startDate > today) {
        upcomingCampaigns += 1;
      } else if (hasValidStart && (!hasValidEnd || endDate >= today)) {
        runningCampaigns += 1;
      } else if (hasValidEnd && endDate < today) {
        endedCampaigns += 1;
      }

      const createdAt = campaign.createdAt ? new Date(campaign.createdAt) : null;
      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        campaignsByMonth[key] = (campaignsByMonth[key] || 0) + 1;
      }

      const kpis = Array.isArray(campaign.kpis) ? campaign.kpis : [];
      totalKpis += kpis.length;
      for (const item of kpis) {
        const metric = item.metric || 'unknown';
        kpisByMetric[metric] = (kpisByMetric[metric] || 0) + 1;
      }

      const contentItems = Array.isArray(campaign.contentCalendar) ? campaign.contentCalendar : [];
      totalContentItems += contentItems.length;
      for (const item of contentItems) {
        const status = item.status || 'unknown';
        const type = item.contentType || 'unknown';
        const platform = item.platform || 'unknown';

        contentByStatus[status] = (contentByStatus[status] || 0) + 1;
        contentByType[type] = (contentByType[type] || 0) + 1;
        contentByPlatform[platform] = (contentByPlatform[platform] || 0) + 1;

        if (status === 'posted') postedContentCount += 1;
      }

      const aiVersions = Array.isArray(campaign.aiVersions) ? campaign.aiVersions : [];
      if (aiVersions.length > 0) campaignsWithAIVersion += 1;
      totalAIVersions += aiVersions.length;
      activeAIVersions += aiVersions.filter((version) => version && version.isActive).length;
    }

    const activeCampaigns = totalCampaigns - (lifecycleByStage.cancelled || 0) - (lifecycleByStage.draft || 0);
    const avgBudget = totalCampaigns > 0 ? Number((totalBudget / totalCampaigns).toFixed(2)) : 0;
    const avgWeeks = totalCampaigns > 0 ? Number((totalWeeks / totalCampaigns).toFixed(2)) : 0;

    const topGoal = Object.keys(goalsByType).sort((a, b) => goalsByType[b] - goalsByType[a])[0] || null;
    const mostUsedMetric = Object.keys(kpisByMetric).sort((a, b) => kpisByMetric[b] - kpisByMetric[a])[0] || null;

    const publicationRatePercent = totalCampaigns ? Math.round((publishedCampaigns / totalCampaigns) * 100) : 0;
    const completionRatePercent = totalCampaigns ? Math.round((completedCampaigns / totalCampaigns) * 100) : 0;
    const cancellationRatePercent = totalCampaigns ? Math.round((cancelledCampaigns / totalCampaigns) * 100) : 0;
    const postingCompletionPercent = totalContentItems ? Math.round((postedContentCount / totalContentItems) * 100) : 0;
    const aiAdoptionRatePercent = totalCampaigns ? Math.round((campaignsWithAIVersion / totalCampaigns) * 100) : 0;
    const averageVersionsPerCampaign = totalCampaigns ? Number((totalAIVersions / totalCampaigns).toFixed(2)) : 0;

    sendSuccess(res, 200, 'Campaign analytics retrieved successfully', {
      summary: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        cancelledCampaigns,
        publishedCampaigns
      },
      budget: {
        totalBudget: Number(totalBudget.toFixed(2)),
        averageBudget: avgBudget,
        minBudget: Number.isFinite(minBudget) ? minBudget : 0,
        maxBudget,
        byCurrency: budgetByCurrency
      },
      lifecycle: {
        byStage: lifecycleByStage,
        publicationRatePercent,
        completionRatePercent,
        cancellationRatePercent
      },
      goals: {
        byGoal: goalsByType,
        topGoal
      },
      duration: {
        averageWeeks: avgWeeks,
        totalWeeks,
        runningCampaigns,
        upcomingCampaigns,
        endedCampaigns
      },
      kpis: {
        totalKpis,
        byMetric: kpisByMetric,
        mostUsedMetric
      },
      content: {
        totalItems: totalContentItems,
        byStatus: contentByStatus,
        byType: contentByType,
        byPlatform: contentByPlatform,
        postingCompletionPercent
      },
      ai: {
        campaignsWithAIVersion,
        aiAdoptionRatePercent,
        totalVersions: totalAIVersions,
        activeVersions: activeAIVersions,
        averageVersionsPerCampaign
      },
      timeline: {
        campaignsByMonth
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single campaign with all relations
// @route   GET /api/campaigns/:id
// @access  Private
exports.getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user && req.user.id;

    const campaign = await loadCampaignDetail(id, ownerId);

    if (!campaign) {
      return next(new AppError('Campaign not found or you do not have access', 404));
    }

    sendSuccess(res, 200, 'Campaign retrieved successfully', 
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Save AI output for an existing campaign (new version)
// @route   POST /api/campaigns/:id/ai
// @access  Private
exports.saveAiCampaign = async (req, res, next) => {
  try {
    const campaignId = Number(req.params.id);
    const ownerId = req.user?.id;

    const campaign = await Campaign.findOne({ where: { id: campaignId, userId: ownerId } });
    if (!campaign) {
      return next(new AppError('Campaign not found or you do not have access', 404));
    }

    await Campaign.sequelize.transaction(async (t) => {
      await persistCampaignAi({
        campaignId,
        body: req.body,
        transaction: t,
        setActive: true,
        syncCalendar: req.body.syncCalendar !== false,
      });

    });

    const full = await loadCampaignDetail(campaignId, ownerId);
    sendSuccess(res, 200, 'AI campaign data saved successfully.', );
  } catch (error) {
    next(error);
  }
};

// @desc    Replace active AI version for a campaign
// @route   PUT /api/campaigns/:id/ai
// @access  Private
exports.updateAiCampaign = async (req, res, next) => {
  try {
    const campaignId = Number(req.params.id);
    const ownerId = req.user?.id;

    const campaign = await Campaign.findOne({ where: { id: campaignId, userId: ownerId } });
    if (!campaign) {
      return next(new AppError('Campaign not found or you do not have access', 404));
    }

    await Campaign.sequelize.transaction(async (t) => {
      await persistCampaignAi({
        campaignId,
        body: req.body,
        transaction: t,
        setActive: true,
        syncCalendar: req.body.syncCalendar === true,
      });
    });

    const full = await loadCampaignDetail(campaignId, ownerId);
    sendSuccess(res, 200, 'AI campaign data updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
exports.deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user && req.user.id;

    const campaign = await Campaign.findOne({
      where: { id, userId: ownerId }
    });

    if (!campaign) {
      return next(new AppError('Campaign not found or you do not have access', 404));
    }

    // Delete the campaign (cascade deletes will handle related records)
    await campaign.destroy();

    // Log the delete action
    await logAction({
      userId: ownerId,
      action: 'DELETE_CAMPAIGN',
      details: {
        campaignId: id,
        campaignName: campaign.campaignName
      }
    });

    sendSuccess(res, 200, 'Campaign deleted successfully', {
      deletedCampaignId: id
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Create a manual campaign
// @route   POST /api/campaigns
//@access  Private
exports.createCampaign = async (req, res, next) => {
  try {
    const {
      campaignName,
      isPublished
    } = req.body;

    const goal = resolveCampaignGoal(req.body);
    const amount = resolveBudgetAmount(req.body);
    const currency = resolveCurrency(req.body);

    // Validation
    if (!campaignName || !goal || !amount || !currency) {
      return next(new AppError('Please provide all required fields', 400));
    }

    // Validate budget
    if (Number(amount) <= 0) {
      return next(new AppError('Budget must be greater than 0', 400));
    }

    // Create manual campaign with draft stage
    const campaign = await Campaign.create(
      buildCampaignPayload({
        body: req.body,
        userId: req.user?.id || 1,
        status: 'draft',
        isPublished: isPublished !== undefined ? isPublished : false
      })
    );

    sendSuccess(res, 201, 'Manual campaign created successfully.', {
      campaign: campaignResponse(campaign)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active campaigns for authenticated user
// @route   GET /api/campaigns/active
// @access  Private
exports.getActiveCampaigns = async (req, res, next) => {
  try {
    const ownerId = req.user && req.user.id;
    const { Op } = require('sequelize');
    const today = new Date();

    const activeCampaigns = await Campaign.findAll({
      where: {
        userId: ownerId,
        // Must be published and not cancelled/draft
        isPublished: true,
        status: { [Op.in]: ['active'] },
        // Must have started (startDate <= today)
        startDate: { [Op.lte]: today },
        // Must not have ended yet (endDate >= today OR no endDate)
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
      order: [['createdAt', 'DESC']]
    });

    const campaignsWithTracking = activeCampaigns.map((campaignModel) => {
      const campaign = campaignModel.toJSON();

      const start = new Date(campaign.startDate || campaign.createdAt);
      const totalDurationDays = Math.max(1, Number(campaign.campaign_duration_weeks || 1) * 7);
      const elapsedDurationDays = Math.max(0, Math.min(totalDurationDays, Math.ceil((today - start) / (1000 * 60 * 60 * 24))));
      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDurationDays / totalDurationDays) * 100)));

      const calendarItems = Array.isArray(campaign.contentCalendar) ? campaign.contentCalendar : [];
      const postedContentCount = calendarItems.filter((item) => item.status === 'posted').length;
      const failedContentCount = calendarItems.filter((item) => item.status === 'failed').length;
      const scheduledContentCount = calendarItems.filter((item) => item.status === 'scheduled').length;

      const activeAIVersion = Array.isArray(campaign.aiVersions)
        ? campaign.aiVersions.find((version) => version.isActive) || null
        : null;

      return {
        ...campaign,
        tracking: {
          duration: {
            totalDurationDays,
            elapsedDurationDays,
            remainingDurationDays: Math.max(0, totalDurationDays - elapsedDurationDays),
            progressPercent
          },
          kpis: {
            totalKpis: Array.isArray(campaign.kpis) ? campaign.kpis.length : 0,
            metrics: Array.isArray(campaign.kpis) ? campaign.kpis.map((item) => item.metric) : []
          },
          content: {
            totalItems: calendarItems.length,
            postedContentCount,
            scheduledContentCount,
            failedContentCount
          },
          ai: {
            totalVersions: Array.isArray(campaign.aiVersions) ? campaign.aiVersions.length : 0,
            activeVersion: activeAIVersion
          }
        }
      };
    });

    const totalKpis = campaignsWithTracking.reduce((sum, campaign) => sum + campaign.tracking.kpis.totalKpis, 0);
    const totalContentItems = campaignsWithTracking.reduce((sum, campaign) => sum + campaign.tracking.content.totalItems, 0);
    const totalPostedContent = campaignsWithTracking.reduce((sum, campaign) => sum + campaign.tracking.content.postedContentCount, 0);
    const averageProgressPercent = campaignsWithTracking.length
      ? Math.round(campaignsWithTracking.reduce((sum, campaign) => sum + campaign.tracking.duration.progressPercent, 0) / campaignsWithTracking.length)
      : 0;

    sendSuccess(res, 200, 'Active campaigns retrieved successfully', {
      campaigns: campaignsWithTracking,
      trackingTools: {
        totalActiveCampaigns: campaignsWithTracking.length,
        totalKpis,
        totalContentItems,
        totalPostedContent,
        averageProgressPercent
      }
    });
  } catch (error) {
    next(error);
  }
};
