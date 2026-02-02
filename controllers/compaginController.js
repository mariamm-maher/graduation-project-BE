const Campaign = require('../models/Campaign');
const KPI = require('../models/KPI');
const TargetAudience = require('../models/TargetAudience');
const ContentCalendar = require('../models/ContentCalendar');
const { generateCampaignWithAI } = require('../services/campaignAIService');
const { logAction } = require('../services/logServices');
const AppError = require('../utils/AppError');
const sendSuccess = require('../utils/sendSuccess');

// @desc    Create a new campaign and get AI preview
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = async (req, res, next) => {
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

  // Create campaign in database
  const campaign = await Campaign.create({
    userId: req.user?.id || 1, // prefer authenticated user if available
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

  // Prepare data for AI service
  const campaignData = {
    campaignId: campaign.id,
    campaignName: campaign.campaignName,
    userDescription: campaign.UserDescription,
    goalType: campaign.goalType,
    totalBudget: campaign.totalBudget,
    currency: campaign.currency,
    budgetFlexibility: campaign.budgetFlexibility,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    lifecycleStage: campaign.lifecycleStage
  };

  // Generate AI campaign preview (don't save to DB yet)
  const aiGeneratedCampaign = await generateCampaignWithAI(campaignData);

  // Return campaign with AI preview
  // Log campaign creation
  try {
    await logAction({ req, action: 'CREATE_CAMPAIGN', entity: 'Campaign', entityId: campaign.id, meta: { campaignName: campaign.campaignName, userId: campaign.userId } });
  } catch (e) {}

  sendSuccess(res, 201, 'Campaign created successfully. AI preview generated.', {
    campaign: {
      id: campaign.id,
      campaignName: campaign.campaignName,
      lifecycleStage: campaign.lifecycleStage,
      createdAt: campaign.createdAt
    },
    aiPreview: aiGeneratedCampaign
  });
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
    if (search) whereClause.campaignName = { [Campaign.sequelize.Op.iLike]: `%${search}%` };

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'campaignName', 'lifecycleStage', 'UserDescription', 'totalBudget', 'currency', 'createdAt', 'updatedAt'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Campaigns retrieved successfully', {
      campaigns,
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

// @desc    Change campaign lifecycle stage
// @route   PATCH /api/campaigns/:id/lifecycle
// @access  Private (OWNER only)
exports.changeLifecycleStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lifecycleStage } = req.body;
    const allowedStages = ['draft', 'ai_generated', 'active', 'completed'];

    if (!allowedStages.includes(lifecycleStage)) {
      return next(new AppError('Invalid lifecycle stage', 400));
    }

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    // Optionally: check if req.user.id === campaign.userId for ownership

    campaign.lifecycleStage = lifecycleStage;
    await campaign.save();

    sendSuccess(res, 200, `Campaign lifecycle stage updated to ${lifecycleStage}`, {
      id: campaign.id,
      campaignName: campaign.campaignName,
      lifecycleStage: campaign.lifecycleStage,
      updatedAt: campaign.updatedAt
    });
  } catch (error) {
    next(error);
  }
};
