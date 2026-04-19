const Campaign = require('../models/Campaign');
const KPI = require('../models/KPI');
const TargetAudience = require('../models/TargetAudience');
const ContentCalendar = require('../models/ContentCalendar');
const CampaignAIVersion = require('../models/CampaignAIVersion');
const { generateCampaignWithAI } = require('../services/campaignAIService');
const { logAction } = require('../services/logServices');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');
const sendSuccess = require('../utils/sendSuccess');

const resolveCampaignGoal = (payload = {}) => payload.goalType || payload.campaign_goal || payload.campaignGoal;

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

const buildCampaignPayload = ({ body, userId, lifecycleStage, isPublished }) => {
  const goal = resolveCampaignGoal(body);
  const amount = resolveBudgetAmount(body);
  const currency = resolveCurrency(body);

  return {
    userId,
    campaignName: body.campaignName,
    campaign_goal: body.campaign_goal || goal,
    budget_amount: body.budget_amount !== undefined ? body.budget_amount : amount,
    budget_currency: body.budget_currency || currency,
    campaign_duration_weeks: resolveDurationWeeks(body),
    lifecycleStage,
    isPublished
  };
};

// @desc    Generate AI campaign draft
// @route   POST /api/campaigns/ai/generate
// @access  Private
exports.generateAICampaign = async (req, res, next) => {
  try {
    const {
      campaignName, 
      budgetFlexibility,
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
      platforms
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
      budgetFlexibility: budgetFlexibility || 'flexible',
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
      lifecycleStage: 'ai_generated',
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
  const t = await Campaign.sequelize.transaction();
  
  try {
    const {
      campaignName,
      targetAudience,
      kpis,
      contentCalendar,
      aiVersion
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

    // Create campaign as draft (unpublished)
    const campaign = await Campaign.create(
      buildCampaignPayload({
        body: req.body,
        userId: req.user?.id || 1,
        lifecycleStage: 'draft',
        isPublished: false
      }),
      { transaction: t }
    );

    // Create Target Audience if provided
    if (targetAudience) {
      await TargetAudience.create({
        campaignId: campaign.id,
        ageRange: targetAudience.ageRange,
        gender: targetAudience.gender,
        interests: targetAudience.interests,
        platformsUsed: targetAudience.platformsUsed
      }, { transaction: t });
    }

    // Create KPIs if provided
    if (kpis && Array.isArray(kpis)) {
      for (const kpi of kpis) {
        await KPI.create({
          campaignId: campaign.id,
          metric: kpi.metric,
          targetValue: kpi.targetValue
        }, { transaction: t });
      }
    }

    // Create Content Calendar if provided
    if (contentCalendar && Array.isArray(contentCalendar)) {
      for (const content of contentCalendar) {
        await ContentCalendar.create({
          campaignId: campaign.id,
          day: content.day,
          date: content.date,
          platform: content.platform,
          contentType: content.contentType,
          caption: content.caption,
          mediaUrl: content.mediaUrl,
          task: content.task,
          status: content.status || 'scheduled'
        }, { transaction: t });
      }
    }

    // Create Campaign AI Version if provided
    if (aiVersion) {
      const CampaignAIVersion = require('../models/CampaignAIVersion');
      await CampaignAIVersion.create({
        campaignId: campaign.id,
        versionNumber: aiVersion.versionNumber || 1,
        strategy: aiVersion.strategy,
        execution: aiVersion.execution,
        estimations: aiVersion.estimations,
        isActive: aiVersion.isActive !== undefined ? aiVersion.isActive : true
      }, { transaction: t });
    }

    await t.commit();

    sendSuccess(res, 201, 'Campaign draft saved successfully.', {
      campaign: {
        id: campaign.id,
        campaignName: campaign.campaignName,
        lifecycleStage: campaign.lifecycleStage,
        isPublished: campaign.isPublished,
        userId: campaign.userId,
        createdAt: campaign.createdAt
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// @desc    Save and publish campaign in one step with all relations
// @route   POST /api/campaigns/save-and-publish
// @access  Private
exports.saveAndPublish = async (req, res, next) => {
  const t = await Campaign.sequelize.transaction();
  
  try {
    const {
      campaignName,
      targetAudience,
      kpis,
      contentCalendar,
      aiVersion
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

    // Create and immediately publish campaign
    const campaign = await Campaign.create(
      buildCampaignPayload({
        body: req.body,
        userId: req.user?.id || 1,
        lifecycleStage: 'saved',
        isPublished: true
      }),
      { transaction: t }
    );

    // Create Target Audience if provided
    if (targetAudience) {
      await TargetAudience.create({
        campaignId: campaign.id,
        ageRange: targetAudience.ageRange,
        gender: targetAudience.gender,
        interests: targetAudience.interests,
        platformsUsed: targetAudience.platformsUsed
      }, { transaction: t });
    }

    // Create KPIs if provided
    if (kpis && Array.isArray(kpis)) {
      for (const kpi of kpis) {
        await KPI.create({
          campaignId: campaign.id,
          metric: kpi.metric,
          targetValue: kpi.targetValue
        }, { transaction: t });
      }
    }

    // Create Content Calendar if provided
    if (contentCalendar && Array.isArray(contentCalendar)) {
      for (const content of contentCalendar) {
        await ContentCalendar.create({
          campaignId: campaign.id,
          day: content.day,
          date: content.date,
          platform: content.platform,
          contentType: content.contentType,
          caption: content.caption,
          mediaUrl: content.mediaUrl,
          task: content.task,
          status: content.status || 'scheduled'
        }, { transaction: t });
      }
    }

    // Create Campaign AI Version if provided
    if (aiVersion) {
      const CampaignAIVersion = require('../models/CampaignAIVersion');
      await CampaignAIVersion.create({
        campaignId: campaign.id,
        versionNumber: aiVersion.versionNumber || 1,
        strategy: aiVersion.strategy,
        execution: aiVersion.execution,
        estimations: aiVersion.estimations,
        isActive: aiVersion.isActive !== undefined ? aiVersion.isActive : true
      }, { transaction: t });
    }

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

    await t.commit();

    try {
      await notificationService.createNotification({
        userId: campaign.userId,
        type: 'CAMPAIGN_PUBLISHED',
        message: `Campaign "${campaign.campaignName}" was published`,
        entityType: 'Campaign',
        entityId: campaign.id,
        metadata: {
          lifecycleStage: campaign.lifecycleStage
        }
      });
    } catch (notifError) {
      console.error('Failed to send CAMPAIGN_PUBLISHED notification:', notifError);
    }

    sendSuccess(res, 201, 'Campaign saved and published successfully.', {
      campaign: {
        id: campaign.id,
        campaignName: campaign.campaignName,
        lifecycleStage: campaign.lifecycleStage,
        isPublished: campaign.isPublished,
        userId: campaign.userId,
        createdAt: campaign.createdAt
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// @desc    Save campaign with all relations
// @route   POST /api/campaigns/save
// @access  Private
exports.saveCampaign = async (req, res, next) => {
  const t = await Campaign.sequelize.transaction();
  
  try {
    const {
      campaignName,
      targetAudience,
      kpis,
      contentCalendar,
      aiVersion,
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

    // Create campaign with saved stage (do NOT publish by default)
    const campaign = await Campaign.create(
      buildCampaignPayload({
        body: req.body,
        userId: req.user?.id || 1,
        lifecycleStage: 'saved',
        isPublished: isPublished !== undefined ? isPublished : false
      }),
      { transaction: t }
    );

    // Create Target Audience if provided
    if (targetAudience) {
      await TargetAudience.create({
        campaignId: campaign.id,
        ageRange: targetAudience.ageRange,
        gender: targetAudience.gender,
        interests: targetAudience.interests,
        platformsUsed: targetAudience.platformsUsed
      }, { transaction: t });
    }

    // Create KPIs if provided
    if (kpis && Array.isArray(kpis)) {
      for (const kpi of kpis) {
        await KPI.create({
          campaignId: campaign.id,
          metric: kpi.metric,
          targetValue: kpi.targetValue
        }, { transaction: t });
      }
    }

    // Create Content Calendar if provided
    if (contentCalendar && Array.isArray(contentCalendar)) {
      for (const content of contentCalendar) {
        await ContentCalendar.create({
          campaignId: campaign.id,
          day: content.day,
          date: content.date,
          platform: content.platform,
          contentType: content.contentType,
          caption: content.caption,
          mediaUrl: content.mediaUrl,
          task: content.task,
          status: content.status || 'scheduled'
        }, { transaction: t });
      }
    }

    // Create Campaign AI Version if provided
    if (aiVersion) {
      const CampaignAIVersion = require('../models/CampaignAIVersion');
      await CampaignAIVersion.create({
        campaignId: campaign.id,
        versionNumber: aiVersion.versionNumber || 1,
        strategy: aiVersion.strategy,
        execution: aiVersion.execution,
        estimations: aiVersion.estimations,
        isActive: aiVersion.isActive !== undefined ? aiVersion.isActive : true
      }, { transaction: t });
    }

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

    await t.commit();

    if (campaign.isPublished) {
      try {
        await notificationService.createNotification({
          userId: campaign.userId,
          type: 'CAMPAIGN_PUBLISHED',
          message: `Campaign "${campaign.campaignName}" was published`,
          entityType: 'Campaign',
          entityId: campaign.id,
          metadata: {
            lifecycleStage: campaign.lifecycleStage
          }
        });
      } catch (notifError) {
        console.error('Failed to send CAMPAIGN_PUBLISHED notification:', notifError);
      }
    }

    sendSuccess(res, 201, 'Campaign saved successfully.', {
      campaign: {
        id: campaign.id,
        campaignName: campaign.campaignName,
        lifecycleStage: campaign.lifecycleStage,
        isPublished: campaign.isPublished,
        userId: campaign.userId,
        createdAt: campaign.createdAt
      }
    });
  } catch (error) {
    await t.rollback();
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

    // Only allow completing if lifecycle is saved
    if (campaign.lifecycleStage !== 'saved') {
      return next(new AppError('Only saved campaigns can be completed', 400));
    }

    campaign.lifecycleStage = 'completed';
    await campaign.save();

    try {
      await notificationService.createNotification({
        userId: campaign.userId,
        type: 'CAMPAIGN_APPROVED',
        message: `Campaign "${campaign.campaignName}" is marked as completed`,
        entityType: 'Campaign',
        entityId: campaign.id,
        metadata: {
          lifecycleStage: campaign.lifecycleStage
        }
      });
    } catch (notifError) {
      console.error('Failed to send CAMPAIGN_APPROVED notification:', notifError);
    }

    sendSuccess(res, 200, 'Campaign completed successfully.', {
      campaign: {
        id: campaign.id,
        campaignName: campaign.campaignName,
        lifecycleStage: campaign.lifecycleStage,
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
    if (campaign.lifecycleStage === 'completed') {
      return next(new AppError('Completed campaigns cannot be cancelled', 400));
    }

    campaign.lifecycleStage = 'cancelled';
    await campaign.save();

    try {
      await notificationService.createNotification({
        userId: campaign.userId,
        type: 'CAMPAIGN_REJECTED',
        message: `Campaign "${campaign.campaignName}" was cancelled`,
        entityType: 'Campaign',
        entityId: campaign.id,
        metadata: {
          lifecycleStage: campaign.lifecycleStage
        }
      });
    } catch (notifError) {
      console.error('Failed to send CAMPAIGN_REJECTED notification:', notifError);
    }

    sendSuccess(res, 200, 'Campaign cancelled successfully.', {
      campaign: {
        id: campaign.id,
        campaignName: campaign.campaignName,
        lifecycleStage: campaign.lifecycleStage,
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
    const { page = 1, limit = 10, lifecycleStage, goalType, search } = req.query;
    const offset = (page - 1) * limit;
    const { Op } = require('sequelize');

    // Build where clause for owner's campaigns
    const whereClause = { userId: ownerId };
    if (lifecycleStage) whereClause.lifecycleStage = lifecycleStage;
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
        'lifecycleStage',
        'campaign_goal',
        'budget_amount',
        'budget_currency',
        'campaign_duration_weeks',
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
        totalSaved: 0,
        recentCampaigns: []
      });
    }

    const totalCampaigns = await Campaign.count({ where: { userId: ownerId } });
    const totalSaved = await Campaign.count({ where: { userId: ownerId, lifecycleStage: 'saved' } });

    const recent = await Campaign.findAll({
      where: { userId: ownerId },
      attributes: [
        'id',
        'campaignName',
        'lifecycleStage',
        'campaign_goal',
        'budget_amount',
        'budget_currency',
        'campaign_duration_weeks',
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
      totalSaved,
      recentCampaigns: recentWithExtras
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

    const campaign = await Campaign.findOne({
      where: { id, userId: ownerId },
      include: [
        {
          model: TargetAudience,
          as: 'targetAudience'
        },
        {
          model: KPI,
          as: 'kpis'
        },
        {
          model: ContentCalendar,
          as: 'contentCalendar'
        },
        {
          model: require('../models/CampaignAIVersion'),
          as: 'aiVersions'
        }
      ]
    });

    if (!campaign) {
      return next(new AppError('Campaign not found or you do not have access', 404));
    }

    sendSuccess(res, 200, 'Campaign retrieved successfully', { campaign });
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
// @access  Private
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
        lifecycleStage: 'draft',
        isPublished: isPublished !== undefined ? isPublished : false
      })
    );

    sendSuccess(res, 201, 'Manual campaign created successfully.', {
      campaign: {
        id: campaign.id,
        campaignName: campaign.campaignName,
        lifecycleStage: campaign.lifecycleStage,
        userId: campaign.userId,
        createdAt: campaign.createdAt
      }
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
        lifecycleStage: { [Op.notIn]: ['cancelled'] }
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

      const start = new Date(campaign.createdAt);
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
