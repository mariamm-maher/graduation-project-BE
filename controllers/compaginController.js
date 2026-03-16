const Campaign = require('../models/Campaign');
const KPI = require('../models/KPI');
const TargetAudience = require('../models/TargetAudience');
const ContentCalendar = require('../models/ContentCalendar');
const { generateCampaignWithAI } = require('../services/campaignAIService');
const { logAction } = require('../services/logServices');
const AppError = require('../utils/AppError');
const sendSuccess = require('../utils/sendSuccess');

// @desc    Generate AI campaign draft
// @route   POST /api/campaigns/ai/generate
// @access  Private
exports.generateAICampaign = async (req, res, next) => {
  try {
    const {
      campaignName,
      userDescription,
      goalType,
      totalBudget,
      currency,
      budgetFlexibility,
      startDate,
      endDate
    } = req.body;

    // Validation
    if (!campaignName || !userDescription || !goalType || !totalBudget || !currency || !startDate || !endDate) {
      return next(new AppError('Please provide all required fields', 400));
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return next(new AppError('End date must be after start date', 400));
    }

    // Validate budget
    if (totalBudget <= 0) {
      return next(new AppError('Budget must be greater than 0', 400));
    }

    // Prepare data for AI service (do NOT persist to DB)
    const campaignData = {
      campaignId: null,
      userId: req.user?.id || null,
      campaignName,
      userDescription,
      goalType,
      totalBudget,
      currency,
      budgetFlexibility: budgetFlexibility || 'flexible',
      startDate: start,
      endDate: end,
      lifecycleStage: 'ai_generated',
      isPublished: false
    };

    // Generate AI campaign preview
    const aiGeneratedCampaign = await generateCampaignWithAI(campaignData);

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
      userDescription,
      goalType,
      totalBudget,
      currency,
      budgetFlexibility,
      startDate,
      endDate,
      targetAudience,
      kpis,
      contentCalendar,
      aiVersion
    } = req.body;

    // Validation
    if (!campaignName || !userDescription || !goalType || !totalBudget || !currency || !startDate || !endDate) {
      return next(new AppError('Please provide all required fields', 400));
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return next(new AppError('End date must be after start date', 400));
    }

    // Validate budget
    if (totalBudget <= 0) {
      return next(new AppError('Budget must be greater than 0', 400));
    }

    // Create campaign as draft (unpublished)
    const campaign = await Campaign.create({
      userId: req.user?.id || 1,
      campaignName,
      UserDescription: userDescription,
      goalType,
      totalBudget,
      currency,
      budgetFlexibility: budgetFlexibility || 'flexible',
      startDate: start,
      endDate: end,
      lifecycleStage: 'draft',
      isPublished: false
    }, { transaction: t });

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
      userDescription,
      goalType,
      totalBudget,
      currency,
      budgetFlexibility,
      startDate,
      endDate,
      targetAudience,
      kpis,
      contentCalendar,
      aiVersion
    } = req.body;

    // Validation
    if (!campaignName || !userDescription || !goalType || !totalBudget || !currency || !startDate || !endDate) {
      return next(new AppError('Please provide all required fields', 400));
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return next(new AppError('End date must be after start date', 400));
    }

    // Validate budget
    if (totalBudget <= 0) {
      return next(new AppError('Budget must be greater than 0', 400));
    }

    // Create and immediately publish campaign
    const campaign = await Campaign.create({
      userId: req.user?.id || 1,
      campaignName,
      UserDescription: userDescription,
      goalType,
      totalBudget,
      currency,
      budgetFlexibility: budgetFlexibility || 'flexible',
      startDate: start,
      endDate: end,
      lifecycleStage: 'saved',
      isPublished: true
    }, { transaction: t });

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
      userDescription,
      goalType,
      totalBudget,
      currency,
      budgetFlexibility,
      startDate,
      endDate,
      targetAudience,
      kpis,
      contentCalendar,
      aiVersion,
      isPublished
    } = req.body;

    // Validation
    if (!campaignName || !userDescription || !goalType || !totalBudget || !currency || !startDate || !endDate) {
      return next(new AppError('Please provide all required fields', 400));
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return next(new AppError('End date must be after start date', 400));
    }

    // Validate budget
    if (totalBudget <= 0) {
      return next(new AppError('Budget must be greater than 0', 400));
    }

    // Create campaign with saved stage (do NOT publish by default)
    const campaign = await Campaign.create({
      userId: req.user?.id || 1,
      campaignName,
      UserDescription: userDescription,
      goalType,
      totalBudget,
      currency,
      budgetFlexibility: budgetFlexibility || 'flexible',
      startDate: start,
      endDate: end,
      lifecycleStage: 'saved',
      isPublished: isPublished !== undefined ? isPublished : false
    }, { transaction: t });

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

    // Build where clause for owner's campaigns
    const whereClause = { userId: ownerId };
    if (lifecycleStage) whereClause.lifecycleStage = lifecycleStage;
    if (goalType) whereClause.goalType = goalType;
    if (search) {
      const { Op } = require('sequelize');
      whereClause.campaignName = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'campaignName', 'lifecycleStage', 'UserDescription', 'totalBudget', 'currency', 'startDate', 'endDate', 'goalType', 'createdAt', 'updatedAt'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Add `goals` (from goalType) and computed `duration` (days between startDate and endDate)
    const campaignsWithExtras = campaigns.map(c => {
      const camp = c && typeof c.toJSON === 'function' ? c.toJSON() : c;
      const goals = camp.goalType || null;
      let duration = null;
      if (camp.startDate && camp.endDate) {
        const start = new Date(camp.startDate);
        const end = new Date(camp.endDate);
        duration = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      }
      return { ...camp, goals, duration };
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
      attributes: ['id', 'campaignName', 'lifecycleStage', 'UserDescription', 'startDate', 'endDate', 'goalType', 'isPublished', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 2
    });

    const recentWithExtras = recent.map(c => {
      const camp = c && typeof c.toJSON === 'function' ? c.toJSON() : c;
      const goals = camp.goalType || null;
      let duration = null;
      if (camp.startDate && camp.endDate) {
        const start = new Date(camp.startDate);
        const end = new Date(camp.endDate);
        duration = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      }
      return { ...camp, goals, duration };
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
      userDescription,
      goalType,
      totalBudget,
      currency,
      budgetFlexibility,
      startDate,
      endDate
    } = req.body;

    // Validation
    if (!campaignName || !userDescription || !goalType || !totalBudget || !currency || !startDate || !endDate) {
      return next(new AppError('Please provide all required fields', 400));
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return next(new AppError('End date must be after start date', 400));
    }

    // Validate budget
    if (totalBudget <= 0) {
      return next(new AppError('Budget must be greater than 0', 400));
    }

    // Create manual campaign with draft stage
    const campaign = await Campaign.create({
      userId: req.user?.id || 1,
      campaignName,
      UserDescription: userDescription,
      goalType,
      totalBudget,
      currency,
      budgetFlexibility: budgetFlexibility || 'flexible',
      startDate: start,
      endDate: end,
      lifecycleStage: 'draft'
    });

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
