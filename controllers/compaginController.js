const Campaign = require('../models/Campaign');
const KPI = require('../models/KPI');
const TargetAudience = require('../models/TargetAudience');
const ContentCalendar = require('../models/ContentCalendar');
const { generateCampaignWithAI } = require('../services/campaignAIService');
const AppError = require('../utils/AppError');

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
};


// @desc    Get all campaigns for authenticated user
// @route   GET /api/campaigns
// @access  Private
exports.getCampaigns = async (req, res, next) => {
  try {
    const compagins= {
      id: 1,
      campaignName: "Summer Sale",
      status: "active",
      createdAt: new Date()
    } 
res.status(200).json({
      success: true,
      data: { compagins }
    });

  }
  catch (error) {
    next(error);
  }
}