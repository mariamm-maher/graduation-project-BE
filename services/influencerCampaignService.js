const { Op } = require('sequelize');
const {
  Campaign,
  Collaboration,
  CollaborationRequest,
  ContentCalendar,
  User,
  OwnerProfile
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
  const brandName = campaign.user?.ownerProfile?.businessName
    || `${campaign.user?.firstName || ''} ${campaign.user?.lastName || ''}`.trim()
    || 'Brand';

  return {
    id: String(campaign.id),
    name: campaign.campaignName,
    description: campaign.UserDescription,
    brand: {
      id: String(campaign.user?.id || ''),
      name: brandName
    },
    budget: {
      total: parseNumber(campaign.totalBudget),
      currency: campaign.currency || 'USD'
    },
    lifecycleStage: campaign.lifecycleStage,
    isPublished: campaign.isPublished,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    platforms: getCampaignPlatforms(campaign.contentCalendar || []),
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
    endDate: { [Op.gte]: new Date() },
    lifecycleStage: { [Op.notIn]: ['draft', 'cancelled', 'completed'] },
    totalBudget: { [Op.gte]: minPayment }
  };

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
          attributes: ['businessName'],
          required: false
        }]
      },
      {
        model: ContentCalendar,
        as: 'contentCalendar',
        attributes: ['platform'],
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
          attributes: ['businessName'],
          required: false
        }]
      },
      {
        model: ContentCalendar,
        as: 'contentCalendar',
        attributes: ['platform', 'date', 'contentType', 'task'],
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
      endDate: { [Op.gte]: new Date() },
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
