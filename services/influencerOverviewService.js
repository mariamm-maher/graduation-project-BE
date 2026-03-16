const { Op } = require('sequelize');
const {
  Campaign,
  Collaboration,
  CollaborationContract,
  CollaborationTask,
  CollaborationRequest,
  ContentCalendar,
  KPI,
  ChatRoom,
  Message,
  User,
  OwnerProfile,
  InfluencerProfile
} = require('../models');
const {
  parseNumeric,
  clamp,
  toDateRange,
  getBucketKey,
  buildSeriesSkeleton,
  computeProfileCompletion
} = require('../utils/influencerOverviewHelpers');

const buildBrand = (ownerUser, ownerProfile) => ({
  id: String(ownerUser?.id || ownerProfile?.userId || ''),
  name: ownerProfile?.businessName || `${ownerUser?.firstName || ''} ${ownerUser?.lastName || ''}`.trim() || 'Brand'
});

const inferCollabIsActive = (collab) => ['live', 'in_progress', 'active'].includes(collab.status);

const influencerOverviewService = {
  async getInfluencerOverview(influencerId, query = {}) {
    const { startDate, endDate, groupBy } = toDateRange(query.dateRange || '30d');

    const platformFilter = query.platform ? String(query.platform).toLowerCase() : null;
    const minPaymentFilter = parseNumeric(query.minPayment || 0);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = clamp(parseInt(query.limit, 10) || 10, 1, 50);

    const [influencerProfile, collaborations, collaborationRequests, contracts, tasks, unreadMessages] = await Promise.all([
      InfluencerProfile.findOne({
        where: { userId: influencerId }
      }),
      Collaboration.findAll({
        where: { influencerId },
        attributes: ['id', 'campaignId', 'ownerId', 'status', 'createdAt'],
        include: [
          {
            model: Campaign,
            as: 'campaign',
            attributes: ['id', 'campaignName', 'endDate', 'startDate', 'lifecycleStage', 'totalBudget', 'currency', 'createdAt'],
            include: [{ model: KPI, as: 'kpis', attributes: ['metric', 'targetValue'], required: false }]
          },
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'firstName', 'lastName'],
            include: [{ model: OwnerProfile, as: 'ownerProfile', attributes: ['businessName'], required: false }]
          },
          {
            model: CollaborationContract,
            as: 'contract',
            required: false,
            attributes: ['id', 'agreedPrice', 'ownerSigned', 'influencerSigned', 'createdAt']
          },
          {
            model: CollaborationTask,
            as: 'tasks',
            required: false,
            attributes: ['id', 'status', 'dueDate', 'platform', 'createdAt']
          }
        ]
      }),
      CollaborationRequest.findAll({
        where: { influencerId },
        attributes: ['id', 'campaignId', 'ownerId', 'status', 'proposedBudget', 'createdAt']
      }),
      CollaborationContract.findAll({
        include: [{
          model: Collaboration,
          as: 'collaboration',
          required: true,
          where: { influencerId },
          attributes: ['id']
        }],
        attributes: ['id', 'collaborationId', 'agreedPrice', 'createdAt', 'ownerSigned', 'influencerSigned']
      }),
      CollaborationTask.findAll({
        include: [{
          model: Collaboration,
          as: 'collaboration',
          required: true,
          where: { influencerId },
          attributes: ['id', 'campaignId', 'ownerId'],
          include: [{
            model: Campaign,
            as: 'campaign',
            attributes: ['id', 'campaignName']
          }, {
            model: User,
            as: 'owner',
            attributes: ['id', 'firstName', 'lastName'],
            include: [{ model: OwnerProfile, as: 'ownerProfile', attributes: ['businessName'], required: false }]
          }]
        }],
        attributes: ['id', 'status', 'platform', 'dueDate', 'createdAt']
      }),
      Message.count({
        where: {
          status: { [Op.ne]: 'read' },
          senderId: { [Op.ne]: influencerId }
        },
        include: [{
          model: ChatRoom,
          as: 'chatRoom',
          required: true,
          include: [{
            model: Collaboration,
            as: 'collaboration',
            required: true,
            where: { influencerId },
            attributes: ['id']
          }]
        }]
      })
    ]);

    const activeCollaborationsRaw = collaborations.filter(inferCollabIsActive);

    const overdueDeliverables = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const isDone = ['approved', 'completed'].includes(task.status);
      return !isDone && new Date(task.dueDate) < new Date();
    }).length;

    const pendingActions = overdueDeliverables + unreadMessages;

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEarnings = contracts
      .filter((contract) => new Date(contract.createdAt) >= currentMonthStart)
      .reduce((sum, contract) => sum + parseNumeric(contract.agreedPrice), 0);

    const rangeCollabs = collaborations.filter((collab) => {
      const createdAt = new Date(collab.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });

    const seriesKeys = buildSeriesSkeleton(startDate, endDate, groupBy);
    const seriesMap = new Map(seriesKeys.map((key) => [key, { engagement: 0, reach: 0 }]));

    const pushSeries = (dateValue, engagement, reach) => {
      if (!dateValue) return;
      const key = getBucketKey(new Date(dateValue), groupBy);
      if (!seriesMap.has(key)) return;
      const current = seriesMap.get(key);
      current.engagement += engagement;
      current.reach += reach;
    };

    for (const collab of rangeCollabs) {
      const kpis = collab.campaign?.kpis || [];
      const reach = kpis
        .filter((kpi) => kpi.metric === 'reach')
        .reduce((sum, kpi) => sum + parseNumeric(kpi.targetValue), 0);

      const engagement = kpis
        .filter((kpi) => kpi.metric === 'engagement_rate')
        .reduce((sum, kpi) => sum + parseNumeric(kpi.targetValue), 0)
        + (collab.tasks?.length || 0);

      pushSeries(collab.createdAt, engagement, reach);
    }

    const performanceSeries = seriesKeys.map((key) => {
      const values = seriesMap.get(key) || { engagement: 0, reach: 0 };
      return {
        timestamp: new Date(key),
        engagement: Math.round(values.engagement),
        reach: Math.round(values.reach)
      };
    });

    const totalEngagement = performanceSeries.reduce((sum, item) => sum + item.engagement, 0);
    const totalReach = performanceSeries.reduce((sum, item) => sum + item.reach, 0);

    const activeCollaborations = activeCollaborationsRaw
      .map((collab) => {
        const doneStatuses = ['approved', 'completed'];
        const completed = (collab.tasks || []).filter((task) => doneStatuses.includes(task.status)).length;
        const total = (collab.tasks || []).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        const platforms = Array.from(
          new Set((collab.tasks || []).map((task) => task.platform).filter(Boolean))
        );

        const daysLeftRaw = collab.campaign?.endDate
          ? Math.ceil((new Date(collab.campaign.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        const brand = buildBrand(collab.owner, collab.owner?.ownerProfile);

        return {
          id: String(collab.id),
          campaignName: collab.campaign?.campaignName || 'Untitled Campaign',
          brand: brand.name,
          status: collab.status,
          earnings: parseNumeric(collab.contract?.agreedPrice),
          deliverables: {
            completed,
            total
          },
          progress,
          daysLeft: Math.max(0, daysLeftRaw),
          platforms
        };
      })
      .sort((a, b) => b.daysLeft - a.daysLeft)
      .slice(0, 5);

    const collaboratingCampaignIds = new Set(collaborations.map((collab) => collab.campaignId));
    const appliedCampaignIds = new Set(collaborationRequests.map((request) => request.campaignId));

    const availableWhere = {
      isPublished: true,
      endDate: { [Op.gte]: now },
      lifecycleStage: { [Op.notIn]: ['draft', 'cancelled', 'completed'] }
    };

    const availableCampaignCandidates = await Campaign.findAll({
      where: availableWhere,
      attributes: ['id', 'campaignName', 'totalBudget', 'currency', 'endDate', 'lifecycleStage', 'createdAt', 'userId'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName'],
          include: [{ model: OwnerProfile, as: 'ownerProfile', attributes: ['businessName'], required: false }]
        },
        {
          model: ContentCalendar,
          as: 'contentCalendar',
          attributes: ['platform'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const availableFiltered = availableCampaignCandidates
      .filter((campaign) => !collaboratingCampaignIds.has(campaign.id))
      .filter((campaign) => !appliedCampaignIds.has(campaign.id))
      .map((campaign) => {
        const platforms = Array.from(new Set((campaign.contentCalendar || []).map((row) => row.platform).filter(Boolean)));
        const payment = parseNumeric(campaign.totalBudget);

        return {
          id: String(campaign.id),
          name: campaign.campaignName,
          brand: buildBrand(campaign.user, campaign.user?.ownerProfile).name,
          payment: {
            min: Number((payment * 0.6).toFixed(2)),
            max: Number(payment.toFixed(2)),
            currency: campaign.currency || 'USD'
          },
          deadline: campaign.endDate,
          platforms,
          status: campaign.lifecycleStage,
          applied: false,
          saved: false
        };
      })
      .filter((campaign) => {
        if (platformFilter && !campaign.platforms.map((p) => String(p).toLowerCase()).includes(platformFilter)) {
          return false;
        }
        if (minPaymentFilter > 0 && campaign.payment.max < minPaymentFilter) {
          return false;
        }
        return true;
      });

    const totalAvailable = availableFiltered.length;
    const startIndex = (page - 1) * limit;
    const availableCampaigns = availableFiltered.slice(startIndex, startIndex + limit);

    const activity = [];

    for (const task of tasks) {
      const campaign = task.collaboration?.campaign;
      const brand = buildBrand(task.collaboration?.owner, task.collaboration?.owner?.ownerProfile);

      if (task.status === 'approved' || task.status === 'in_review') {
        activity.push({
          id: `deliverable-${task.id}`,
          action: 'deliverable_submitted',
          campaign: { id: String(campaign?.id || ''), name: campaign?.campaignName || 'Campaign' },
          brand: { id: brand.id, name: brand.name },
          platform: task.platform || 'in_app',
          status: task.status,
          occurredAt: task.createdAt,
          requiresAction: false
        });
      }

      if (task.dueDate && new Date(task.dueDate) < now && !['approved', 'completed'].includes(task.status)) {
        activity.push({
          id: `followup-${task.id}`,
          action: 'deliverable_submitted',
          campaign: { id: String(campaign?.id || ''), name: campaign?.campaignName || 'Campaign' },
          brand: { id: brand.id, name: brand.name },
          platform: task.platform || 'in_app',
          status: 'overdue',
          occurredAt: task.createdAt,
          requiresAction: true
        });
      }
    }

    for (const request of collaborationRequests) {
      if (request.status === 'pending' || request.status === 'negotiating') {
        activity.push({
          id: `invite-${request.id}`,
          action: 'campaign_invite',
          campaign: { id: String(request.campaignId), name: 'Campaign' },
          brand: { id: String(request.ownerId), name: 'Brand' },
          platform: 'in_app',
          status: request.status,
          occurredAt: request.createdAt,
          requiresAction: true
        });
      } else {
        activity.push({
          id: `application-${request.id}`,
          action: 'application_sent',
          campaign: { id: String(request.campaignId), name: 'Campaign' },
          brand: { id: String(request.ownerId), name: 'Brand' },
          platform: 'in_app',
          status: request.status,
          occurredAt: request.createdAt,
          requiresAction: false
        });
      }
    }

    const recentMessages = await Message.findAll({
      where: {
        senderId: { [Op.ne]: influencerId }
      },
      include: [{
        model: ChatRoom,
        as: 'chatRoom',
        required: true,
        include: [{
          model: Collaboration,
          as: 'collaboration',
          required: true,
          where: { influencerId },
          include: [
            {
              model: Campaign,
              as: 'campaign',
              attributes: ['id', 'campaignName']
            },
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName'],
              include: [{ model: OwnerProfile, as: 'ownerProfile', attributes: ['businessName'], required: false }]
            }
          ]
        }]
      }],
      attributes: ['id', 'status', 'sentAt']
    });

    for (const message of recentMessages) {
      const collab = message.chatRoom?.collaboration;
      const brand = buildBrand(collab?.owner, collab?.owner?.ownerProfile);

      activity.push({
        id: `message-${message.id}`,
        action: 'message_received',
        campaign: {
          id: String(collab?.campaign?.id || ''),
          name: collab?.campaign?.campaignName || 'Campaign'
        },
        brand: {
          id: brand.id,
          name: brand.name
        },
        platform: 'chat',
        status: message.status,
        occurredAt: message.sentAt,
        requiresAction: message.status !== 'read'
      });
    }

    for (const contract of contracts) {
      const collab = collaborations.find((item) => item.id === contract.collaborationId);
      if (!collab) continue;
      const brand = buildBrand(collab.owner, collab.owner?.ownerProfile);

      activity.push({
        id: `payment-${contract.id}`,
        action: 'payment_received',
        campaign: {
          id: String(collab.campaign?.id || ''),
          name: collab.campaign?.campaignName || 'Campaign'
        },
        brand: {
          id: brand.id,
          name: brand.name
        },
        platform: collab.campaign?.goalType || 'in_app',
        status: contract.influencerSigned ? 'signed' : 'pending',
        occurredAt: contract.createdAt,
        requiresAction: !contract.influencerSigned
      });
    }

    const activityFeed = activity
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
      .slice(0, 20);

    return {
      kpis: {
        totalEngagement: Math.round(totalEngagement),
        totalReach: Math.round(totalReach),
        activeCollaborations: activeCollaborationsRaw.length,
        pendingActions,
        monthlyEarnings: Number(monthlyEarnings.toFixed(2))
      },
      performanceSeries,
      activeCollaborations,
      availableCampaigns,
      activityFeed,
      profileCompletion: computeProfileCompletion(influencerProfile)
    };
  }
};

module.exports = influencerOverviewService;
