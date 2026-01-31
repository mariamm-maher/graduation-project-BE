const { User, Session, Campaign, Collaboration, Role, OwnerProfile, InfluencerProfile } = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');
const { Log } = require('../models');

// @desc    Get admin dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private (ADMIN only)
exports.getAnalytics = async (req, res, next) => {
  try {
    // Get total counts
    const totalUsers = await User.count();
    const totalCampaigns = await Campaign.count();
    const totalCollaborations = await Collaboration.count();
    
    // Get active sessions count
    const activeSessions = await Session.count({
      where: {
        revokedAt: null,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    // Get users by role
    const ownerCount = await Role.findOne({
      where: { name: 'OWNER' },
      include: [{
        model: User,
        as: 'users',
        attributes: ['id']
      }]
    });

    const influencerCount = await Role.findOne({
      where: { name: 'INFLUENCER' },
      include: [{
        model: User,
        as: 'users',
        attributes: ['id']
      }]
    });

    // Get campaign statistics by lifecycle stage
    const campaignStats = await Campaign.findAll({
      attributes: [
        'lifecycleStage',
        [Campaign.sequelize.fn('COUNT', Campaign.sequelize.col('id')), 'count']
      ],
      group: ['lifecycleStage']
    });

    // Get collaboration statistics by status
    const collaborationStats = await Collaboration.findAll({
      attributes: [
        'status',
        [Collaboration.sequelize.fn('COUNT', Collaboration.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    sendSuccess(res, 200, 'Analytics retrieved successfully', {
      overview: {
        totalUsers,
        totalCampaigns,
        totalCollaborations,
        activeSessions,
        recentUsers
      },
      usersByRole: {
        owners: ownerCount?.users?.length || 0,
        influencers: influencerCount?.users?.length || 0
      },
      campaignStats: campaignStats.reduce((acc, stat) => {
        acc[stat.lifecycleStage] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      collaborationStats: collaborationStats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.dataValues.count);
        return acc;
      }, {})
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (ADMIN only)
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Build include for roles
    const includeClause = [
      {
        model: Role,
        as: 'roles',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }
    ];

    // Filter by role if specified
    if (role) {
      includeClause[0].where = { name: role };
      includeClause[0].required = true;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: includeClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    sendSuccess(res, 200, 'Users retrieved successfully', {
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get all sessions
// @route   GET /api/admin/sessions
// @access  Private (ADMIN only)
exports.getSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, active } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (active === 'true') {
      whereClause.revokedAt = null;
      whereClause.expiresAt = {
        [Op.gt]: new Date()
      };
    }

    const { count, rows: sessions } = await Session.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      attributes: ['id', 'userId', 'ip', 'userAgent', 'createdAt', 'expiresAt', 'revokedAt'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Sessions retrieved successfully', {
      sessions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get all collaborations
// @route   GET /api/admin/collaborations
// @access  Private (ADMIN only)
exports.getCollaborations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: collaborations } = await Collaboration.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'campaignName', 'lifecycleStage']
        },
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Collaborations retrieved successfully', {
      collaborations,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get all campaigns
// @route   GET /api/admin/campaigns
// @access  Private (ADMIN only)
exports.getCampaigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, lifecycleStage, goalType } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (lifecycleStage) {
      whereClause.lifecycleStage = lifecycleStage;
    }
    if (goalType) {
      whereClause.goalType = goalType;
    }

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
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
    return next(error);
  }
};

// @desc    Get logs (paginated, admin only)
// @route   GET /api/admin/logs
// @access  Private (ADMIN only)
exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, entity, action, actor } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (entity) whereClause.entity = entity;
    if (action) whereClause.action = action;
    if (actor) whereClause.actor = actor;

    const { count, rows: logs } = await Log.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'actorUser', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Logs retrieved successfully', {
      logs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get recent activity (newest 10 logs)
// @route   GET /api/admin/logs/recent
// @access  Private (ADMIN only)
exports.getRecentActivity = async (req, res, next) => {
  try {
    const recent = await Log.findAll({
      include: [{ model: User, as: 'actorUser', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Recent activity retrieved successfully', { recent });
  } catch (error) {
    return next(error);
  }
};
