const { Op } = require('sequelize');
const {
  Campaign,
  Collaboration,
  CollaborationRequest,
  ContentCalendar,
  User,
  OwnerProfile,
  InfluencerProfile,
  KPI,
  TargetAudience,
  InterestMessage
} = require('../models');
const AppError = require('../utils/AppError');

const parseNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getCampaignPlatforms = (contentCalendar = []) => {
  return Array.from(new Set(contentCalendar.map((item) => item.platform).filter(Boolean)));
};

const toCampaignDTO = (campaign, { applied = false } = {}) => {
  const profile = campaign.user?.ownerProfile;
  const brandName = profile?.brand_name
    || `${campaign.user?.firstName || ''} ${campaign.user?.lastName || ''}`.trim()
    || 'Brand';

  return {
    id: String(campaign.id),
    name: campaign.campaignName,
    description: campaign.campaign_goal
      ? `${campaign.campaign_goal} campaign${profile?.product_or_service ? ' for ' + profile.product_or_service : ''}`
      : null,
    brand: {
      id: String(campaign.user?.id || ''),
      name: brandName,
      industry: profile?.industry || null,
      website: profile?.website || null,
      companySize: profile?.company_size || null,
      targetMarket: profile?.target_market || [],
      image: profile?.image || null,
    },
    budget: {
      total: parseNumber(campaign.budget_amount),
      currency: campaign.budget_currency || 'USD'
    },
    campaignGoal: campaign.campaign_goal,
    durationWeeks: campaign.campaign_duration_weeks,
    startDate: campaign.startDate || null,
    endDate: campaign.endDate || null,
    lifecycleStage: campaign.lifecycleStage,
    isPublished: campaign.isPublished,
    platforms: getCampaignPlatforms(campaign.contentCalendar || []),
    kpis: (campaign.kpis || []).map((k) => ({ metric: k.metric, targetValue: k.targetValue })),
    targetAudience: campaign.targetAudience
      ? {
          ageRange: campaign.targetAudience.ageRange,
          gender: campaign.targetAudience.gender,
          interests: campaign.targetAudience.interests || [],
          platformsUsed: campaign.targetAudience.platformsUsed || []
        }
      : null,
    applied
  };
};

async function getExistingCampaignRelations(influencerId) {
  const [collaborations, requests] = await Promise.all([
    Collaboration.findAll({
      where: { influencerId },
      attributes: ['campaignId']
    }),
    CollaborationRequest.findAll({
      where: {
        influencerId,
        status: { [Op.in]: ['pending', 'negotiating', 'accepted'] }
      },
      attributes: ['campaignId']
    })
  ]);

  const existingCampaignIds = new Set([
    ...collaborations.map((item) => item.campaignId),
    ...requests.map((item) => item.campaignId)
  ]);

  return existingCampaignIds;
}

exports.exploreCampaigns = async ({ influencerId, query }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const minPayment = parseNumber(query.minPayment, 0);
  const platform = query.platform ? String(query.platform).trim() : null;

  const existingCampaignIds = await getExistingCampaignRelations(influencerId);

  let platformCampaignIds = null;
  if (platform) {
    const matchingCalendar = await ContentCalendar.findAll({
      where: {
        platform: { [Op.iLike]: `%${platform}%` }
      },
      attributes: ['campaignId'],
      group: ['campaignId']
    });

    platformCampaignIds = matchingCalendar.map((item) => item.campaignId);

    if (!platformCampaignIds.length) {
      return {
        campaigns: [],
        pagination: {
          page,
          limit,
          totalItems: 0,
          totalPages: 0
        }
      };
    }
  }

  const where = {
    isPublished: true,
    lifecycleStage: { [Op.notIn]: ['draft', 'cancelled', 'completed'] }
  };

  if (minPayment > 0) {
    where.budget_amount = { [Op.gte]: minPayment };
  }

  if (existingCampaignIds.size > 0) {
    where.id = { [Op.notIn]: Array.from(existingCampaignIds) };
  }

  if (platformCampaignIds) {
    where.id = where.id
      ? { [Op.and]: [where.id, { [Op.in]: platformCampaignIds }] }
      : { [Op.in]: platformCampaignIds };
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Campaign.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName'],
        include: [{
          model: OwnerProfile,
          as: 'ownerProfile',
          attributes: ['brand_name', 'industry', 'website', 'company_size', 'target_market', 'product_or_service', 'image'],
          required: false
        }]
      },
      {
        model: ContentCalendar,
        as: 'contentCalendar',
        attributes: ['platform'],
        required: false
      },
      {
        model: KPI,
        as: 'kpis',
        attributes: ['metric', 'targetValue'],
        required: false
      },
      {
        model: TargetAudience,
        as: 'targetAudience',
        required: false
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true
  });

  return {
    campaigns: rows.map((campaign) => toCampaignDTO(campaign, { applied: false })),
    pagination: {
      page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

exports.getCampaignById = async ({ influencerId, campaignId }) => {
  const campaign = await Campaign.findOne({
    where: {
      id: campaignId,
      isPublished: true
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName'],
        include: [{
          model: OwnerProfile,
          as: 'ownerProfile',
          attributes: ['brand_name', 'industry', 'website', 'company_size', 'target_market', 'product_or_service', 'image'],
          required: false
        }]
      },
      {
        model: ContentCalendar,
        as: 'contentCalendar',
        attributes: ['platform', 'date', 'contentType', 'task', 'caption', 'status'],
        required: false
      },
      {
        model: KPI,
        as: 'kpis',
        attributes: ['metric', 'targetValue'],
        required: false
      },
      {
        model: TargetAudience,
        as: 'targetAudience',
        required: false
      }
    ]
  });

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  const [existingRequest, existingCollab] = await Promise.all([
    CollaborationRequest.findOne({
      where: {
        campaignId,
        influencerId,
        status: { [Op.in]: ['pending', 'negotiating', 'accepted'] }
      },
      attributes: ['id', 'status', 'createdAt']
    }),
    Collaboration.findOne({
      where: {
        campaignId,
        influencerId
      },
      attributes: ['id', 'status', 'createdAt']
    })
  ]);

  return {
    campaign: {
      ...toCampaignDTO(campaign, { applied: Boolean(existingRequest || existingCollab) }),
      application: existingRequest
        ? {
            requestId: String(existingRequest.id),
            status: existingRequest.status,
            createdAt: existingRequest.createdAt
          }
        : null,
      collaboration: existingCollab
        ? {
            collaborationId: String(existingCollab.id),
            status: existingCollab.status,
            createdAt: existingCollab.createdAt
          }
        : null
    }
  };
};

exports.applyToCampaign = async ({ influencerId, campaignId, payload }) => {
  const campaign = await Campaign.findOne({
    where: {
      id: campaignId,
      isPublished: true,
      lifecycleStage: { [Op.notIn]: ['draft', 'cancelled', 'completed'] }
    },
    attributes: ['id', 'userId', 'campaignName']
  });

  if (!campaign) {
    throw new AppError('Campaign is not open for application', 400);
  }

  const [existingRequest, existingCollab] = await Promise.all([
    CollaborationRequest.findOne({
      where: {
        campaignId,
        influencerId,
        status: { [Op.in]: ['pending', 'negotiating', 'accepted'] }
      }
    }),
    Collaboration.findOne({
      where: {
        campaignId,
        influencerId
      }
    })
  ]);

  if (existingRequest || existingCollab) {
    throw new AppError('You already applied or are collaborating on this campaign', 409);
  }

  const proposedBudget = payload.proposedBudget !== undefined
    ? parseNumber(payload.proposedBudget, null)
    : null;

  if (payload.proposedBudget !== undefined && (proposedBudget === null || proposedBudget < 0)) {
    throw new AppError('proposedBudget must be a valid non-negative number', 400);
  }

  const request = await CollaborationRequest.create({
    campaignId: campaign.id,
    ownerId: campaign.userId,
    influencerId,
    proposedBudget,
    message: payload.message || null,
    status: 'pending'
  });

  return {
    request: {
      id: String(request.id),
      campaignId: String(request.campaignId),
      ownerId: String(request.ownerId),
      influencerId: String(request.influencerId),
      status: request.status,
      proposedBudget: parseNumber(request.proposedBudget, 0),
      message: request.message,
      createdAt: request.createdAt
    }
  };
};

exports.sendInterestMessage = async ({ influencerId, campaignId, message }) => {
  if (!message || !String(message).trim()) {
    throw new AppError('Message is required', 400);
  }

  const campaign = await Campaign.findOne({
    where: { id: campaignId, isPublished: true },
    attributes: ['id', 'userId', 'campaignName']
  });

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  const influencer = await User.findByPk(influencerId, {
    attributes: ['id', 'firstName', 'lastName']
  });

  const influencerName = `${influencer?.firstName || ''} ${influencer?.lastName || ''}`.trim() || 'An influencer';

  const record = await InterestMessage.create({
    campaignId: campaign.id,
    ownerId: campaign.userId,
    influencerId,
    message: String(message).trim()
  });

  return {
    sent: true,
    id: record.id,
    campaignId: String(campaignId),
    ownerId: String(campaign.userId),
    influencerName,
    message: String(message).trim()
  };
};

exports.getOverviewStats = async ({ ownerId }) => {
  const today = new Date();

  const [activeCollaboratorNow, totalInfluencersInSystem, pastCollaboratingNumber] = await Promise.all([
    Collaboration.count({
      where: {
        ownerId,
        status: { [Op.in]: ['live', 'in_progress'] },
        [Op.and]: [
          {
            [Op.or]: [
              { startDate: null },
              { startDate: { [Op.lte]: today } }
            ]
          },
          {
            [Op.or]: [
              { endDate: null },
              { endDate: { [Op.gte]: today } }
            ]
          }
        ]
      }
    }),
    InfluencerProfile.count(),
    Collaboration.count({
      where: {
        ownerId,
        [Op.or]: [
          { status: { [Op.in]: ['completed', 'cancelled'] } },
          { endDate: { [Op.lt]: today } }
        ]
      }
    })
  ]);

  return {
    activeCollaboratorNow,
    totalInfluencersInSystem,
    pastCollaboratingNumber
  };
};
