const Campaign = require('../models/Campaign');
const KPI = require('../models/KPI');
const TargetAudience = require('../models/TargetAudience');
const ContentCalendar = require('../models/ContentCalendar');
const { generateCampaignWithAI } = require('../services/campaignAIService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Create a new campaign and get AI preview
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = asyncHandler(async (req, res, next) => {
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
    userId: 1, // req.user.id (assuming authentication middleware sets req.user)
    campaignName,
    UserDescription: userDescription,
    goalType,
    totalBudget,
    currency,
    budgetFlexibility: budgetFlexibility || 'flexible',
    startDate: start,
    endDate: end,
    status: 'draft'
  });

  // Optional: Create associated empty TargetAudience and KPIs ???

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
  };

  // Generate AI campaign preview (don't save to DB yet)
  const aiGeneratedCampaign = await generateCampaignWithAI(campaignData);

  // Return campaign with AI preview
  res.status(201).json({
    success: true,
    message: 'Campaign created successfully. AI preview generated.',
    data: {
      campaign: {
        id: campaign.id,
        campaignName: campaign.campaignName,
        status: campaign.status,
        createdAt: campaign.createdAt
      },
      aiPreview: aiGeneratedCampaign
    }
  });
});

// @desc    Get all campaigns for user
// @route   GET /api/campaigns
// @access  Private
exports.getCampaigns = asyncHandler(async (req, res, next) => {
  const campaigns = await Campaign.findAll({
    where: { userId: req.user.id },
    include: [
      { model: KPI, as: 'kpis' },
      { model: TargetAudience, as: 'targetAudience' },
      { model: ContentCalendar, as: 'contentCalendar' }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    success: true,
    count: campaigns.length,
    data: campaigns
  });
});

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Private
exports.getCampaign = asyncHandler(async (req, res, next) => {
  const campaign = await Campaign.findOne({
    where: { 
      id: req.params.id,
      userId: req.user.id 
    },
    include: [
      { model: KPI, as: 'kpis' },
      { model: TargetAudience, as: 'targetAudience' },
      { model: ContentCalendar, as: 'contentCalendar' }
    ]
  });

  if (!campaign) {
    return next(new AppError('Campaign not found', 404));
  }

  res.status(200).json({
    success: true,
    data: campaign
  });
});
