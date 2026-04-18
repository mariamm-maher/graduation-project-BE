const { Op } = require('sequelize');
const {
  Campaign,
  KPI,
  OwnerProfile,
  Collaboration,
  CollaborationRequest,
  CollaborationContract,
  CollaborationTask,
  ChatRoom,
  Message,
  User,
  InfluencerProfile
} = require('../models');
const AppError = require('../utils/AppError');

const DATE_RANGE_CONFIG = {
  '30d': { days: 30, groupBy: 'day' },
  '90d': { days: 90, groupBy: 'week' },
  '365d': { days: 365, groupBy: 'month' }
};

const parseNumeric = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return 0;

  const multiplier = normalized.endsWith('k') ? 1_000 : normalized.endsWith('m') ? 1_000_000 : 1;
  const raw = normalized.replace(/[^0-9.-]/g, '').replace(/,/g, '');
  const parsed = parseFloat(raw);

  if (!Number.isFinite(parsed)) return 0;
  return parsed * multiplier;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toDateRange = (dateRange = '30d') => {
  const config = DATE_RANGE_CONFIG[dateRange];

  if (!config) {
    throw new AppError('Invalid dateRange. Allowed values: 30d, 90d, 365d', 400);
  }

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - config.days);

  return { startDate, endDate, groupBy: config.groupBy };
};

const getWeekStart = (date) => {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utcDate.setUTCDate(utcDate.getUTCDate() + diff);
  return utcDate;
};

const getBucketKey = (date, groupBy) => {
  const utcDate = new Date(date);

  if (groupBy === 'month') {
    return `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  if (groupBy === 'week') {
    const weekStart = getWeekStart(utcDate);
    return weekStart.toISOString().slice(0, 10);
  }

  return utcDate.toISOString().slice(0, 10);
};

const buildSeriesSkeleton = (startDate, endDate, groupBy) => {
  const buckets = [];
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

  while (cursor <= end) {
    if (groupBy === 'month') {
      cursor.setUTCDate(1);
      const key = getBucketKey(cursor, groupBy);
      if (!buckets.includes(key)) buckets.push(key);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      continue;
    }

    if (groupBy === 'week') {
      const weekStart = getWeekStart(cursor);
      const key = weekStart.toISOString().slice(0, 10);
      if (!buckets.includes(key)) buckets.push(key);
      cursor.setUTCDate(cursor.getUTCDate() + 7);
      continue;
    }

    buckets.push(getBucketKey(cursor, groupBy));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return buckets;
};

const progressPercentage = (startDate, endDate, now = new Date()) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const current = now.getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;

  const percent = ((current - start) / (end - start)) * 100;
  return Math.round(clamp(percent, 0, 100));
};

const daysLeft = (endDate, now = new Date()) => {
  if (!endDate) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  const remaining = Math.ceil((new Date(endDate).getTime() - now.getTime()) / msPerDay);
  return Math.max(0, remaining);
};

const fullName = (user) => {
  if (!user) return 'Unknown Influencer';
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const name = `${firstName} ${lastName}`.trim();
  return name || 'Unknown Influencer';
};

const buildInfluencerSummary = (user) => ({
  id: String(user?.id || ''),
  name: fullName(user),
  avatarUrl: user?.influencerProfile?.image || null
});

const ownerOverviewService = {
  async getOwnerOverview(ownerId, dateRange = '30d') {
    if (!ownerId) {
      throw new AppError('Owner user is required', 400);
    }

    const { startDate, endDate, groupBy } = toDateRange(dateRange);

    const [ownerProfile, campaigns] = await Promise.all([
      OwnerProfile.findOne({
        where: { userId: ownerId },
        attributes: ['brand_name']
      }),
      Campaign.findAll({
        where: { userId: ownerId },
        attributes: [
          'id',
          'campaignName',
          'lifecycleStage',
          'totalBudget',
          'startDate',
          'endDate',
          'isPublished',
          'createdAt',
          'updatedAt'
        ]
      })
    ]);

    if (!campaigns.length) {
      return {
        kpis: {
          totalEngagement: 0,
          totalReach: 0,
          activeCampaigns: 0,
          pausedCampaigns: 0,
          pendingCampaigns: 0,
          avgROI: 0,
          spendToDate: 0
        },
        performanceSeries: buildSeriesSkeleton(startDate, endDate, groupBy).map((key) => ({
          timestamp: new Date(key),
          engagement: 0,
          reach: 0
        })),
        activeCampaigns: [],
        pendingCampaigns: [],
        communicationsFeed: []
      };
    }

    const campaignIds = campaigns.map((campaign) => campaign.id);

    const [kpis, allRequests, rangeRequests, allCollaborations, rangeCollaborations, allContracts, rangeContracts, rangeTasks, latestMessages] = await Promise.all([
      KPI.findAll({
        where: {
          campaignId: { [Op.in]: campaignIds },
          metric: { [Op.in]: ['reach', 'engagement_rate', 'ROAS'] }
        },
        attributes: ['campaignId', 'metric', 'targetValue']
      }),
      CollaborationRequest.findAll({
        where: {
          ownerId,
          campaignId: { [Op.in]: campaignIds }
        },
        attributes: ['id', 'campaignId', 'influencerId', 'status', 'proposedBudget', 'createdAt'],
        include: [{
          model: User,
          as: 'influencer',
          attributes: ['id', 'firstName', 'lastName'],
          include: [{
            model: InfluencerProfile,
            as: 'influencerProfile',
            attributes: ['image', 'followersCount', 'primaryPlatform']
          }]
        }]
      }),
      CollaborationRequest.findAll({
        where: {
          ownerId,
          campaignId: { [Op.in]: campaignIds },
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        attributes: ['id', 'campaignId', 'influencerId', 'status', 'proposedBudget', 'createdAt'],
        include: [{
          model: User,
          as: 'influencer',
          attributes: ['id', 'firstName', 'lastName'],
          include: [{
            model: InfluencerProfile,
            as: 'influencerProfile',
            attributes: ['image', 'followersCount', 'primaryPlatform']
          }]
        }]
      }),
      Collaboration.findAll({
        where: {
          ownerId,
          campaignId: { [Op.in]: campaignIds }
        },
        attributes: ['id', 'campaignId', 'influencerId', 'status', 'createdAt'],
        include: [{
          model: User,
          as: 'influencer',
          attributes: ['id', 'firstName', 'lastName'],
          include: [{
            model: InfluencerProfile,
            as: 'influencerProfile',
            attributes: ['image', 'followersCount', 'primaryPlatform']
          }]
        }]
      }),
      Collaboration.findAll({
        where: {
          ownerId,
          campaignId: { [Op.in]: campaignIds },
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        attributes: ['id', 'campaignId', 'influencerId', 'status', 'createdAt'],
        include: [{
          model: User,
          as: 'influencer',
          attributes: ['id', 'firstName', 'lastName'],
          include: [{
            model: InfluencerProfile,
            as: 'influencerProfile',
            attributes: ['image', 'followersCount', 'primaryPlatform']
          }]
        }]
      }),
      CollaborationContract.findAll({
        attributes: ['id', 'collaborationId', 'agreedPrice', 'ownerSigned', 'influencerSigned', 'createdAt'],
        include: [{
          model: Collaboration,
          as: 'collaboration',
          required: true,
          where: {
            ownerId,
            campaignId: { [Op.in]: campaignIds }
          },
          attributes: ['id', 'campaignId'],
          include: [{
            model: User,
            as: 'influencer',
            attributes: ['id', 'firstName', 'lastName'],
            include: [{
              model: InfluencerProfile,
              as: 'influencerProfile',
              attributes: ['image', 'followersCount', 'primaryPlatform']
            }]
          }]
        }]
      }),
      CollaborationContract.findAll({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        attributes: ['id', 'collaborationId', 'agreedPrice', 'ownerSigned', 'influencerSigned', 'createdAt'],
        include: [{
          model: Collaboration,
          as: 'collaboration',
          required: true,
          where: {
            ownerId,
            campaignId: { [Op.in]: campaignIds }
          },
          attributes: ['id', 'campaignId'],
          include: [{
            model: User,
            as: 'influencer',
            attributes: ['id', 'firstName', 'lastName'],
            include: [{
              model: InfluencerProfile,
              as: 'influencerProfile',
              attributes: ['image', 'followersCount', 'primaryPlatform']
            }]
          }]
        }]
      }),
      CollaborationTask.findAll({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        attributes: ['id', 'status', 'platform', 'dueDate', 'createdAt', 'collaborationId'],
        include: [{
          model: Collaboration,
          as: 'collaboration',
          required: true,
          where: {
            ownerId,
            campaignId: { [Op.in]: campaignIds }
          },
          attributes: ['id', 'campaignId'],
          include: [{
            model: User,
            as: 'influencer',
            attributes: ['id', 'firstName', 'lastName'],
            include: [{
              model: InfluencerProfile,
              as: 'influencerProfile',
              attributes: ['image', 'followersCount', 'primaryPlatform']
            }]
          }]
        }]
      }),
      Message.findAll({
        attributes: ['id', 'status', 'sentAt', 'chatRoomId', 'senderId', 'content'],
        include: [{
          model: ChatRoom,
          as: 'chatRoom',
          required: true,
          attributes: ['id'],
          include: [{
            model: Collaboration,
            as: 'collaboration',
            required: true,
            where: {
              ownerId,
              campaignId: { [Op.in]: campaignIds }
            },
            attributes: ['id', 'campaignId', 'ownerId', 'influencerId'],
            include: [{
              model: User,
              as: 'influencer',
              attributes: ['id', 'firstName', 'lastName'],
              include: [{
                model: InfluencerProfile,
                as: 'influencerProfile',
                attributes: ['image', 'followersCount', 'primaryPlatform']
              }]
            }]
          }]
        }, {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName']
        }],
        order: [['sentAt', 'DESC']],
        limit: 100
      })
    ]);

    const kpiMap = new Map();
    for (const row of kpis) {
      const campaignId = row.campaignId;
      if (!kpiMap.has(campaignId)) {
        kpiMap.set(campaignId, { reach: 0, engagement: 0, roas: 0 });
      }

      const current = kpiMap.get(campaignId);
      const value = parseNumeric(row.targetValue);

      if (row.metric === 'reach') current.reach += value;
      if (row.metric === 'engagement_rate') current.engagement += value;
      if (row.metric === 'ROAS') current.roas += value;
    }

    const collaborationByCampaign = new Map();
    for (const collab of allCollaborations) {
      const campaignId = collab.campaignId;
      if (!collaborationByCampaign.has(campaignId)) {
        collaborationByCampaign.set(campaignId, []);
      }
      collaborationByCampaign.get(campaignId).push(collab);
    }

    const requestByCampaign = new Map();
    for (const request of allRequests) {
      const campaignId = request.campaignId;
      if (!requestByCampaign.has(campaignId)) {
        requestByCampaign.set(campaignId, []);
      }
      requestByCampaign.get(campaignId).push(request);
    }

    const now = new Date();
    const brandName = ownerProfile?.brand_name || 'Owner Brand';

    const explicitActive = campaigns.filter((campaign) => campaign.lifecycleStage === 'active');
    const fallbackActive = campaigns.filter((campaign) => {
      const stage = campaign.lifecycleStage;
      return ['saved', 'completed', 'active'].includes(stage)
        && campaign.isPublished
        && new Date(campaign.startDate) <= now
        && new Date(campaign.endDate) >= now;
    });

    const activeCampaignPool = explicitActive.length ? explicitActive : fallbackActive;

    const campaignLastActivity = new Map();
    const considerActivity = (campaignId, dateValue) => {
      if (!campaignId || !dateValue) return;
      const ts = new Date(dateValue).getTime();
      const prev = campaignLastActivity.get(campaignId) || 0;
      if (ts > prev) campaignLastActivity.set(campaignId, ts);
    };

    for (const request of allRequests) considerActivity(request.campaignId, request.createdAt);
    for (const collab of allCollaborations) considerActivity(collab.campaignId, collab.createdAt);
    for (const contract of allContracts) considerActivity(contract.collaboration?.campaignId, contract.createdAt);
    for (const task of rangeTasks) considerActivity(task.collaboration?.campaignId, task.createdAt);

    const activeCampaignsData = activeCampaignPool
      .map((campaign) => {
        const campaignKpis = kpiMap.get(campaign.id) || { reach: 0, engagement: 0, roas: 0 };
        const campaignCollaborations = collaborationByCampaign.get(campaign.id) || [];
        const campaignRequests = requestByCampaign.get(campaign.id) || [];

        const influencerMap = new Map();
        for (const collab of campaignCollaborations) {
          influencerMap.set(collab.influencerId, collab.influencer);
        }

        const sortedInfluencers = Array.from(influencerMap.values()).sort(
          (a, b) => parseNumeric(b?.influencerProfile?.followersCount) - parseNumeric(a?.influencerProfile?.followersCount)
        );

        const lead = sortedInfluencers[0];
        const derivedReach = sortedInfluencers.reduce(
          (acc, influencer) => acc + parseNumeric(influencer?.influencerProfile?.followersCount),
          0
        );

        const derivedEngagement =
          campaignCollaborations.length * 10
          + campaignRequests.length * 5
          + (campaignKpis.engagement || 0);

        return {
          id: String(campaign.id),
          name: campaign.campaignName,
          brand: brandName,
          status: campaign.lifecycleStage,
          engagement: Math.round(derivedEngagement),
          reach: Math.round(campaignKpis.reach || derivedReach),
          budget: parseNumeric(campaign.totalBudget),
          progress: progressPercentage(campaign.startDate, campaign.endDate, now),
          daysLeft: daysLeft(campaign.endDate, now),
          influencersCount: influencerMap.size,
          leadInfluencer: lead ? fullName(lead) : 'N/A',
          _lastActivity: campaignLastActivity.get(campaign.id) || new Date(campaign.updatedAt).getTime()
        };
      })
      .sort((a, b) => b._lastActivity - a._lastActivity)
      .slice(0, 5)
      .map(({ _lastActivity, ...clean }) => clean);

    const pendingCampaignsData = campaigns
      .filter((campaign) => ['draft', 'ai_generated', 'approval_pending'].includes(campaign.lifecycleStage))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((campaign) => ({
        id: String(campaign.id),
        name: campaign.campaignName,
        brand: brandName,
        status: campaign.lifecycleStage,
        estimatedTime: campaign.lifecycleStage === 'ai_generated' ? 'AI generation in progress' : null,
        createdAt: campaign.createdAt
      }));

    const seriesKeys = buildSeriesSkeleton(startDate, endDate, groupBy);
    const seriesMap = new Map(seriesKeys.map((key) => [key, { engagement: 0, reach: 0 }]));

    const pushSeries = (dateValue, engagementValue, reachValue) => {
      if (!dateValue) return;
      const key = getBucketKey(new Date(dateValue), groupBy);
      if (!seriesMap.has(key)) return;
      const current = seriesMap.get(key);
      current.engagement += engagementValue;
      current.reach += reachValue;
    };

    for (const request of rangeRequests) {
      pushSeries(
        request.createdAt,
        1,
        parseNumeric(request.influencer?.influencerProfile?.followersCount)
      );
    }

    for (const collab of rangeCollaborations) {
      pushSeries(
        collab.createdAt,
        2,
        parseNumeric(collab.influencer?.influencerProfile?.followersCount)
      );
    }

    for (const contract of rangeContracts) {
      const isSigned = contract.ownerSigned && contract.influencerSigned;
      pushSeries(
        contract.createdAt,
        isSigned ? 3 : 1,
        parseNumeric(contract.collaboration?.influencer?.influencerProfile?.followersCount)
      );
    }

    const performanceSeries = seriesKeys.map((key) => {
      const values = seriesMap.get(key) || { engagement: 0, reach: 0 };
      return {
        timestamp: new Date(key),
        engagement: Math.round(values.engagement),
        reach: Math.round(values.reach)
      };
    });

    const communicationsFeed = latestMessages
      .filter((message) => {
        const collab = message.chatRoom?.collaboration;
        if (!collab) return false;

        const senderId = Number(message.senderId);
        const ownerSender = senderId === Number(collab.ownerId);
        const influencerSender = senderId === Number(collab.influencerId);

        // Keep only direct owner/influencer chat messages for this collaboration
        return ownerSender || influencerSender;
      })
      .map((message) => {
        const influencer = message.chatRoom?.collaboration?.influencer;
        const senderName = fullName(message.sender);

        return {
          id: `message-${message.id}`,
          influencerId: String(influencer?.id || ''),
          influencer: buildInfluencerSummary(influencer),
          action: 'chat_message',
          platform: 'chat',
          status: message.status,
          sender: senderName,
          contentPreview: message.content ? String(message.content).slice(0, 120) : '',
          occurredAt: message.sentAt
        };
      })
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
      .slice(0, 5);

    const totalEngagement = performanceSeries.reduce((sum, item) => sum + item.engagement, 0);
    const totalReach = performanceSeries.reduce((sum, item) => sum + item.reach, 0);

    const spendFromContracts = allContracts.reduce((sum, contract) => sum + parseNumeric(contract.agreedPrice), 0);
    const spendFallback = allRequests
      .filter((request) => ['accepted', 'negotiating'].includes(request.status))
      .reduce((sum, request) => sum + parseNumeric(request.proposedBudget), 0);

    const campaignRois = campaigns
      .map((campaign) => {
        const spend = parseNumeric(campaign.totalBudget);
        if (spend <= 0) return null;
        const roas = parseNumeric(kpiMap.get(campaign.id)?.roas);
        if (roas <= 0) return 0;
        return ((roas * spend - spend) / spend) * 100;
      })
      .filter((value) => value !== null);

    const avgROI = campaignRois.length
      ? campaignRois.reduce((sum, value) => sum + value, 0) / campaignRois.length
      : 0;

    const pausedCampaigns = campaigns.filter((campaign) => campaign.lifecycleStage === 'paused').length;
    const pendingCampaignsCount = campaigns.filter(
      (campaign) => ['draft', 'ai_generated', 'approval_pending'].includes(campaign.lifecycleStage)
    ).length;

    return {
      kpis: {
        totalEngagement: Math.round(totalEngagement),
        totalReach: Math.round(totalReach),
        activeCampaigns: activeCampaignPool.length,
        pausedCampaigns,
        pendingCampaigns: pendingCampaignsCount,
        avgROI: Number(avgROI.toFixed(2)),
        spendToDate: Number((spendFromContracts || spendFallback || 0).toFixed(2))
      },
      performanceSeries,
      activeCampaigns: activeCampaignsData,
      pendingCampaigns: pendingCampaignsData,
      communicationsFeed
    };
  }
};

module.exports = ownerOverviewService;
