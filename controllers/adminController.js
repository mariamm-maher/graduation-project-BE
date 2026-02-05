const { User, Session, Campaign, Collaboration, CollaborationRequest, Role, OwnerProfile, InfluencerProfile, ChatRoom, ChatParticipant, Message, Log } = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

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
    });
  } catch (error) {
    return next(error);
  }
};
// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (ADMIN only)
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Build where clause
    const whereClause = { id };

    // Build include for roles
    const includeClause = [
      {
        model: Role,
        as: 'roles',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }
    ];

    const user = await User.findOne({
      where: whereClause,
      include: includeClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    sendSuccess(res, 200, 'User retrieved successfully', { user });
  } catch (error) {
    return next(error);
  }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private (ADMIN only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role: roleName } = req.body;

    if (!roleName) {
      return next(new AppError('Role name is required', 400));
    }

    // Build where clause
    const whereClause = { id };

    // Build include for roles
    const includeClause = [
      {
        model: Role,
        as: 'roles',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }
    ];

    const user = await User.findOne({
      where: whereClause,
      include: includeClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      return next(new AppError(`Role "${roleName}" not found. Valid roles: OWNER, INFLUENCER, ADMIN`, 400));
    }

    await user.setRoles([role]);

    const updatedUser = await User.findOne({
      where: whereClause,
      include: includeClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt']
    });

    const userData = updatedUser.toJSON();
    const roles = userData.roles || [];
    delete userData.roles;

    sendSuccess(res, 200, 'User role updated successfully', {
      user: userData,
      roles
    });
  } catch (error) {
    return next(error);
  }
};
// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (ADMIN only)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return next(new AppError('Status is required', 400));
    }

    const validStatuses = ['ACTIVE', 'BLOCKED', 'SUSPENDED', 'INCOMPLETE'];
    if (!validStatuses.includes(status)) {
      return next(new AppError(`Invalid status. Valid values: ${validStatuses.join(', ')}`, 400));
    }

    const whereClause = { id };

    const user = await User.findOne({ where: whereClause });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await user.update({ status });

    const updatedUser = await User.findOne({
      where: { id },
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      attributes: ['id', 'firstName', 'lastName', 'email', 'status', 'createdAt', 'updatedAt']
    });

    sendSuccess(res, 200, 'status updated successfully', {
      users: [updatedUser],
    });
  } catch (error) {
    return next(error);
  }
};
// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (ADMIN only)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Build where clause
    const whereClause = { id };

    // Build include for roles
    const includeClause = [
      {
        model: Role,
        as: 'roles',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }
    ];

    const user = await User.findOne({
      where: whereClause,
      include: includeClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Find all chat rooms where user is a participant
    const chatRoomsWithUser = await ChatParticipant.findAll({
      where: { userId: id },
      attributes: ['chatRoomId']
    });

    const chatRoomIds = chatRoomsWithUser.map(cp => cp.chatRoomId);

    // Delete all messages in these chat rooms
    if (chatRoomIds.length > 0) {
      await Message.destroy({
        where: {
          chatRoomId: {
            [Op.in]: chatRoomIds
          }
        }
      });
    }

    // Delete chat participant records for this user
    await ChatParticipant.destroy({
      where: { userId: id }
    });

    // Delete empty chat rooms (where no participants remain)
    if (chatRoomIds.length > 0) {
      const emptyRooms = await ChatRoom.findAll({
        where: {
          id: {
            [Op.in]: chatRoomIds
          }
        },
        include: [{
          model: ChatParticipant,
          as: 'chatParticipants',
          attributes: ['id']
        }]
      });

      for (const room of emptyRooms) {
        if (room.chatParticipants.length === 0) {
          await room.destroy();
        }
      }
    }

    await user.destroy();

    sendSuccess(res, 200, 'User deleted successfully');
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


// @desc    Get all campaigns
// @route   GET /api/admin/campaigns
// @access  Private (ADMIN only)
exports.getCampaigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, goalType, lifecycleStage } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (goalType) {
      whereClause.goalType = goalType;
    }
    if (lifecycleStage) {
      whereClause.lifecycleStage = lifecycleStage;
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
// @desc    Get single campaign by ID
// @route   GET /api/admin/campaigns/:id
// @access  Private (ADMIN only)
exports.getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Build where clause
    const whereClause = { id };

    // Build include for user (owner)
    const includeClause = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ];

    const campaign = await Campaign.findOne({
      where: whereClause,
      include: includeClause
    });

    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    sendSuccess(res, 200, 'Campaign retrieved successfully', { campaign });
  } catch (error) {
    return next(error);
  }
};

// @desc    Update campaign status (lifecycleStage)
// @route   PATCH /api/admin/campaigns/:id/status
// @access  Private (ADMIN only)
exports.updateCampaignStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: lifecycleStage } = req.body;

    if (!lifecycleStage) {
      return next(new AppError('Status is required', 400));
    }

    const validStatuses = ['draft', 'ai_generated', 'active', 'completed'];
    if (!validStatuses.includes(lifecycleStage)) {
      return next(new AppError(`Invalid status. Valid values: ${validStatuses.join(', ')}`, 400));
    }

    // Build where clause
    const whereClause = { id };

    // Build include for user (owner)
    const includeClause = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ];

    const campaign = await Campaign.findOne({
      where: whereClause,
      include: includeClause
    });

    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    await campaign.update({ lifecycleStage });

    const updatedCampaign = await Campaign.findOne({
      where: whereClause,
      include: includeClause
    });

    sendSuccess(res, 200, 'Campaign status updated successfully', { campaign: updatedCampaign });
  } catch (error) {
    return next(error);
  }
};

// @desc    Delete campaign
// @route   DELETE /api/admin/campaigns/:id
// @access  Private (ADMIN only)
exports.deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Build where clause
    const whereClause = { id };

    // Build include for user (owner)
    const includeClause = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ];

    const campaign = await Campaign.findOne({
      where: whereClause,
      include: includeClause
    });

    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    await campaign.destroy();

    sendSuccess(res, 200, 'Campaign deleted successfully');
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
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get single collaboration by ID
// @route   GET /api/admin/collaborations/:id
// @access  Private (ADMIN only)
exports.getCollaborationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    // Build where clause similar to getCollaborations
    const whereClause = { id };
    if (status) whereClause.status = status;

    const collaboration = await Collaboration.findOne({
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
      ]
    });

    if (!collaboration) {
      return next(new AppError('Collaboration not found', 404));
    }

    sendSuccess(res, 200, 'Collaborations retrieved successfully', {
      collaborations: [collaboration],
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get all collaboration requests
// @route   GET /api/admin/collaboration-requests
// @access  Private (ADMIN only)
exports.getCollaborationRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (status) whereClause.status = status;

    const { count, rows: requests } = await CollaborationRequest.findAndCountAll({
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
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Collaboration requests retrieved successfully', {
      collaborationRequests: requests,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Update collaboration request status
// @route   PATCH /api/admin/collaboration-requests/:id/status
// @access  Private (ADMIN only)
exports.updateCollaborationRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return next(new AppError('Status is required', 400));
    }

    const validStatuses = ['pending', 'accepted', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return next(new AppError(`Invalid status. Valid values: ${validStatuses.join(', ')}`, 400));
    }

    const whereClause = { id };

    const request = await CollaborationRequest.findOne({ where: whereClause });
    if (!request) {
      return next(new AppError('Collaboration request not found', 404));
    }

    await request.update({ status });

    const updated = await CollaborationRequest.findOne({
      where: { id },
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'campaignName']
        },
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    sendSuccess(res, 200, 'Collaboration request status updated successfully', {
      collaborationRequests: [updated],
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Update collaboration status
// @route   PATCH /api/admin/collaborations/:id/status
// @access  Private (ADMIN only)
exports.updateCollaborationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return next(new AppError('Status is required', 400));
    }

    const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
   return next(new AppError(`Invalid status. Valid values: ${validStatuses.join(', ')}`, 400));
    }

    const whereClause = { id };

    const collaboration = await Collaboration.findOne({ where: whereClause });
    if (!collaboration) {
      return next(new AppError('Collaboration not found', 404));
    }

    await collaboration.update({ status });

    const updated = await Collaboration.findOne({
      where: { id },
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
      ]
    });

    sendSuccess(res, 200, 'Collaborations updated successfully', {
      collaborations: [updated],
      pagination: {
        total: 1,
        page: 1,
        limit: 1,
        totalPages: 1
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



