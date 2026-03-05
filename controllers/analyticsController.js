const { Campaign, Collaboration, CollaborationRequest, User, UserRole } = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');
const moment = require('moment');

// Helper to get date range
const getDateRange = (dateRange = '30d') => {
  const now = new Date();
  let startDate;

  if (dateRange === '7d') startDate = moment().subtract(7, 'days').toDate();
  else if (dateRange === '30d') startDate = moment().subtract(30, 'days').toDate();
  else if (dateRange === 'monthly') startDate = moment().startOf('month').toDate();
  else startDate = new Date(0); // all time

  return { startDate, endDate: now };
};

// @desc    Dashboard overview based on user's role from DB (no role query needed)
// @route   GET /api/analytics?dateRange=...
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userRoleRecord = await UserRole.findOne({
      where: { userId },
      attributes: ['roleId']
    });

    if (!userRoleRecord) {
      return next(new AppError('No role assigned to this user', 403));
    }

    const roleId = userRoleRecord.roleId;

    let roleName;
    if (roleId === 1) roleName = 'owner';
    else if (roleId === 2) roleName = 'influencer';
    else if (roleId === 3) roleName = 'admin';
    else {
      return next(new AppError('Invalid role ID', 403));
    }

    if (roleId === 3) {
      return next(new AppError('Admin dashboard not implemented yet', 403));
    }

    const { startDate, endDate } = getDateRange(req.query.dateRange || '30d');

    let data = {};

    if (roleName === 'owner') {
      const campaignsCount = await Campaign.count({ where: { userId } });
      const activeCampaigns = await Campaign.count({
        where: {
          userId,
          lifecycleStage: 'active',
          startDate: { [Op.lte]: endDate },
          endDate: { [Op.gte]: startDate }
        }
      });
      const sentRequests = await CollaborationRequest.count({
        where: {
          campaignId: { [Op.in]: (await Campaign.findAll({ where: { userId }, attributes: ['id'] })).map(c => c.id) }
        }
      });
      const activeCollabs = await Collaboration.count({
        where: {
          ownerId: userId,
          status: 'active'
        }
      });
      const totalBudgetUsed = await Collaboration.sum('budget', {
        where: { ownerId: userId }
      }) || 0;

      data = {
        campaigns: { total: campaignsCount, active: activeCampaigns },
        requestsSent: sentRequests,
        activeCollaborations: activeCollabs,
        totalBudgetUsed
      };
    } else if (roleName === 'influencer') {
      const receivedRequests = await CollaborationRequest.count({ where: { influencerId: userId } });
      const activeCollabs = await Collaboration.count({
        where: { influencerId: userId, status: 'active' }
      });
      const totalEarnings = await Collaboration.sum('budget', {
        where: { influencerId: userId, status: { [Op.in]: ['active', 'completed'] } }
      }) || 0;

      data = {
        receivedRequests,
        activeCollaborations: activeCollabs,
        totalEarnings
      };
    }

    sendSuccess(res, 200, `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} dashboard overview`, { data });
  } catch (error) {
    next(error);
  }
};

// @desc    Campaign performance
// @route   GET /api/analytics/campaigns?dateRange=...
// @access  Private (owner only for now)
const getCampaignsAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = getDateRange(req.query.dateRange || '30d');

    const campaigns = await Campaign.findAll({
      where: {
        userId,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      include: [{
        model: Collaboration,
        as: 'collaborations',
        attributes: ['id', 'status', 'budget']
      }],
      attributes: ['id', 'campaignName', 'totalBudget', 'lifecycleStage']
    });

    const analytics = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.campaignName,
      budget: campaign.totalBudget,
      stage: campaign.lifecycleStage,
      collaborationsCount: campaign.collaborations.length,
      activeCollabs: campaign.collaborations.filter(c => c.status === 'active').length,
      totalCollabBudget: campaign.collaborations.reduce((sum, c) => sum + (c.budget || 0), 0)
    }));

    sendSuccess(res, 200, 'Campaigns analytics', { analytics });
  } catch (error) {
    next(error);
  }
};

// @desc    Earnings overview (influencer only)
// @route   GET /api/analytics/earnings?period=monthly
// @access  Private (influencer only)
const getEarnings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userRoleRecord = await UserRole.findOne({
      where: { userId },
      attributes: ['roleId']
    });

    if (!userRoleRecord || userRoleRecord.roleId !== 2) {
      return next(new AppError('This endpoint is for influencers only', 403));
    }

    const period = req.query.period || 'monthly';

    let where = { influencerId: userId };
    if (period === 'monthly') {
      const start = moment().startOf('month').toDate();
      where.createdAt = { [Op.gte]: start };
    }

    const totalEarnings = await Collaboration.sum('budget', {
      where: { ...where, status: { [Op.in]: ['active', 'completed'] } }
    }) || 0;

    const pendingEarnings = await Collaboration.sum('budget', {
      where: { ...where, status: 'pending' }
    }) || 0;

    sendSuccess(res, 200, 'Earnings overview (influencer)', {
      totalEarnings,
      pendingEarnings,
      currency: 'USD'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Collaboration analytics for the current user
// @route   GET /api/analytics/collaborations?dateRange=...
// @access  Private
const getCollaborationsAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = getDateRange(req.query.dateRange || '30d');

    const collabs = await Collaboration.findAll({
      where: {
        [Op.or]: [
          { ownerId: userId },
          { influencerId: userId }
        ],
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'campaignName']
        },
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'email']  
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email']
        }
      ],
      attributes: ['id', 'status', 'budget', 'createdAt']
    });

    const analytics = collabs.map(collab => ({
      id: collab.id,
      status: collab.status,
      budget: collab.budget,
      createdAt: collab.createdAt,
      campaign: collab.campaign ? {
        id: collab.campaign.id,
        name: collab.campaign.campaignName
      } : null,
      influencer: collab.influencer ? {
        id: collab.influencer.id,
        email: collab.influencer.email
      } : null,
      owner: collab.owner ? {
        id: collab.owner.id,
        email: collab.owner.email
      } : null
    }));

    sendSuccess(res, 200, 'Collaborations analytics', { analytics });
  } catch (error) {
    next(error);
  }
};

// @desc    ROI analysis (owner only)
// @route   GET /api/analytics/roi?dateRange=...
// @access  Private (owner only)
const getROI = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userRoleRecord = await UserRole.findOne({
      where: { userId },
      attributes: ['roleId']
    });

    if (!userRoleRecord || userRoleRecord.roleId !== 1) {
      return next(new AppError('This endpoint is for owners only', 403));
    }

    const { startDate, endDate } = getDateRange(req.query.dateRange || '30d');

    const campaigns = await Campaign.findAll({
      where: {
        userId,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      include: [{
        model: Collaboration,
        as: 'collaborations',
        attributes: ['budget']
      }],
      attributes: ['id', 'campaignName', 'totalBudget']
    });

    let totalSpent = 0;
    let totalReturn = 0; // حاليًا مفيش عمود للـ return، فهنسيبه 0 (ممكن نعدله بعدين)

    campaigns.forEach(campaign => {
      totalSpent += campaign.totalBudget || 0;
      // totalReturn += campaign.estimatedReturn || 0; // لو فيه عمود للقيمة المحققة
    });

    const roi = totalSpent > 0 ? ((totalReturn - totalSpent) / totalSpent) * 100 : 0;

    sendSuccess(res, 200, 'ROI analysis (owner)', {
      totalSpent,
      totalReturn,
      roiPercentage: roi.toFixed(2) + '%',
      campaignsCount: campaigns.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Performance metrics (role-based)
// @route   GET /api/analytics/performance?userId={id}&dateRange=...
// @access  Private
const getPerformance = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.query.userId ? parseInt(req.query.userId) : currentUserId;

    const userRoleRecord = await UserRole.findOne({
      where: { userId: currentUserId },
      attributes: ['roleId']
    });

    if (!userRoleRecord) {
      return next(new AppError('No role assigned to this user', 403));
    }

    const roleId = userRoleRecord.roleId;

    if (![1, 2, 3].includes(roleId)) {
      return next(new AppError('Invalid user role', 403));
    }

    if (currentUserId !== targetUserId && roleId !== 3) {
      return next(new AppError('Unauthorized to view this user performance', 403));
    }

    const { startDate, endDate } = getDateRange(req.query.dateRange || '30d');

    let performanceData = {};

    if (roleId === 1 || (roleId === 3 && currentUserId === targetUserId)) {
      // Owner performance
      const campaigns = await Campaign.findAll({
        where: { userId: targetUserId, createdAt: { [Op.between]: [startDate, endDate] } },
        include: [{ model: Collaboration, as: 'collaborations', attributes: ['status', 'budget'] }],
        attributes: ['id', 'campaignName', 'totalBudget', 'lifecycleStage']
      });

      performanceData.asOwner = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.lifecycleStage === 'active').length,
        totalBudget: campaigns.reduce((sum, c) => sum + (c.totalBudget || 0), 0),
        totalCollaborations: campaigns.reduce((sum, c) => sum + c.collaborations.length, 0),
        activeCollaborations: campaigns.reduce((sum, c) => sum + c.collaborations.filter(col => col.status === 'active').length, 0)
      };
    }

    if (roleId === 2 || (roleId === 3 && currentUserId === targetUserId)) {
      // Influencer performance
      const collabs = await Collaboration.findAll({
        where: { influencerId: targetUserId, createdAt: { [Op.between]: [startDate, endDate] } },
        include: [{ model: Campaign, as: 'campaign', attributes: ['campaignName'] }],
        attributes: ['id', 'status', 'budget']
      });

      performanceData.asInfluencer = {
        totalCollaborations: collabs.length,
        activeCollaborations: collabs.filter(c => c.status === 'active').length,
        completedCollaborations: collabs.filter(c => c.status === 'completed').length,
        totalEarnings: collabs.reduce((sum, c) => sum + (c.status === 'completed' || c.status === 'active' ? (c.budget || 0) : 0), 0),
        pendingEarnings: collabs.reduce((sum, c) => sum + (c.status === 'pending' ? (c.budget || 0) : 0), 0)
      };
    }

    if (roleId === 3) {
      // Admin full analytics 
      const totalActiveCampaigns = await Campaign.count({ where: { lifecycleStage: 'active' } });
      const totalActiveCollabs = await Collaboration.count({ where: { status: 'active' } });
      const totalSpent = await Campaign.sum('totalBudget') || 0;
      const totalEarningsPlatform = await Collaboration.sum('budget', {
        where: { status: { [Op.in]: ['active', 'completed'] } }
      }) || 0;

      performanceData.asAdmin = {
        totalActiveCampaigns,
        totalActiveCollabs,
        totalSpent,
        totalEarningsPlatform,
        platformROI: totalSpent > 0 ? ((totalEarningsPlatform - totalSpent) / totalSpent * 100).toFixed(2) + '%' : 'N/A'
      };
    }

    sendSuccess(res, 200, 'Performance metrics', { data: performanceData });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getCampaignsAnalytics,
  getEarnings,
  getCollaborationsAnalytics,
  getROI,
  getPerformance
};