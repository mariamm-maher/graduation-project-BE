const { 
  InfluencerProfile, 
  User,
  Campaign,
  Collaboration,
  CollaborationRequest,
  ChatRoom,
  ChatParticipant,
  Message,
  Notification,
  Review
} = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');

/**
 * Get all influencer profiles
 * Owner can browse all influencers to find potential collaborators
 */
exports.getAllInfluencers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      platform,
      minFollowers,
      maxFollowers,
      location,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const where = {};
    
    // Filter by category
    if (category) {
      where.categories = {
        [require('sequelize').Op.contains]: [category]
      };
    }
    
    // Filter by platform
    if (platform) {
      where.primaryPlatform = platform;
    }
    
    // Filter by followers count range
    if (minFollowers) {
      where.followersCount = {
        ...where.followersCount,
        [require('sequelize').Op.gte]: parseInt(minFollowers)
      };
    }
    if (maxFollowers) {
      where.followersCount = {
        ...where.followersCount,
        [require('sequelize').Op.lte]: parseInt(maxFollowers)
      };
    }
    
    // Filter by location
    if (location) {
      where.location = {
        [require('sequelize').Op.iLike]: `%${location}%`
      };
    }
    
    // Only show completed/onboarded profiles
    // where.isOnboarded = true;
    
    // User search filter (by name or email)
    const userWhere = {};
    if (search) {
      userWhere[require('sequelize').Op.or] = [
        { firstName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { lastName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Do not restrict by user status here — return influencers with any status
    
    // Fetch influencer profiles with user data
    const { count, rows: influencers } = await InfluencerProfile.findAndCountAll({
      where,
      include: [{
          model: User,
          as: 'user',
          // Only expose basic user info useful to Owners
          attributes: ['firstName', 'lastName', 'email', 'status'],
          where: userWhere,
          required: true
        }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['followersCount', 'DESC']], // Default sort by followers
      distinct: true
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    console.log(influencers);
    sendSuccess(res, 200, 'Influencers retrieved successfully', {
      influencers: influencers.map(profile => ({
        id: profile.id,
        userId: profile.userId,
        // Basic user info
        user: {
          firstName: profile.user.firstName,
          lastName: profile.user.lastName,
          email: profile.user.email,
          status: profile.user.status
        },
        // Profile info (only fields useful to Owners)
        bio: profile.bio,
        image: profile.image,
        location: profile.location,
        primaryPlatform: profile.primaryPlatform,
        followersCount: profile.followersCount,
        engagementRate: profile.engagementRate,
        categories: profile.categories,
        contentTypes: profile.contentTypes,
        collaborationTypes: profile.collaborationTypes,
        audienceAgeRange: profile.audienceAgeRange,
        audienceGender: profile.audienceGender,
        audienceLocation: profile.audienceLocation,
        interests: profile.interests,
        completionPercentage: profile.completionPercentage
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single influencer profile by ID
 * Owner can view detailed influencer profile
 */
exports.getInfluencerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Return the influencer profile with related user data and associations
    const influencer = await InfluencerProfile.findOne({
      where: { id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'status', 'createdAt'],
        required: true,
        include: [
          { model: Collaboration, as: 'influencerCollaborations', include: [{ model: Campaign, as: 'campaign', attributes: ['id', 'campaignName'] }], required: false },
          { model: CollaborationRequest, as: 'receivedCollaborationRequests', include: [{ model: Campaign, as: 'campaign', attributes: ['id', 'campaignName'] }], required: false },
          { model: ChatParticipant, as: 'chatParticipations', include: [{ model: ChatRoom, as: 'chatRoom', include: [{ model: Message, as: 'messages', attributes: ['id','senderId','content','sentAt'] }] }], required: false },
          { model: Message, as: 'sentMessages', attributes: ['id','chatRoomId','content','sentAt'], required: false },
          { model: Notification, as: 'notifications', attributes: ['id','type','message','isRead','createdAt'], required: false },
          { model: Review, as: 'receivedReviews', include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] }], required: false }
        ]
      }]
    });
    
    if (!influencer) {
      return next(new AppError('Influencer profile not found', 404));
    }
    
    // Calculate rating metrics
    const reviews = influencer.user?.receivedReviews || [];
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
      : 0;

    // Build an expanded payload with related insights
    const payload = {
      id: influencer.id,
      userId: influencer.userId,
      user: influencer.user ? {
        id: influencer.user.id,
        firstName: influencer.user.firstName,
        lastName: influencer.user.lastName,
        email: influencer.user.email,
        status: influencer.user.status,
        createdAt: influencer.user.createdAt
      } : null,
      profile: {
        bio: influencer.bio,
        image: influencer.image,
        location: influencer.location,
        primaryPlatform: influencer.primaryPlatform,
        followersCount: influencer.followersCount,
        engagementRate: influencer.engagementRate,
        categories: influencer.categories,
        contentTypes: influencer.contentTypes,
        collaborationTypes: influencer.collaborationTypes,
        audienceAgeRange: influencer.audienceAgeRange,
        audienceGender: influencer.audienceGender,
        audienceLocation: influencer.audienceLocation,
        interests: influencer.interests,
        completionPercentage: influencer.completionPercentage,
        socialMediaLinks: influencer.socialMediaLinks
      },
      insights: {
        totalCollaborations: influencer.user?.influencerCollaborations?.length || 0,
        recentCollaborations: (influencer.user?.influencerCollaborations || []).map(c => ({ id: c.id, status: c.status, campaign: c.campaign })),
        pendingRequests: (influencer.user?.receivedCollaborationRequests || []).filter(r => r.status === 'pending').length,
        notificationsCount: influencer.user?.notifications?.length || 0,
        recentMessagesCount: influencer.user?.sentMessages?.length || 0,
        rating: {
          average: averageRating,
          total: totalReviews,
          reviews: reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            reviewText: r.reviewText,
            reviewer: r.reviewer,
            createdAt: r.createdAt
          }))
        }
      },
      related: {
        collaborations: influencer.user?.influencerCollaborations || [],
        collaborationRequests: influencer.user?.receivedCollaborationRequests || [],
        chatParticipations: influencer.user?.chatParticipations || [],
        sentMessages: influencer.user?.sentMessages || [],
        notifications: influencer.user?.notifications || [],
        receivedReviews: reviews
      }
    };
    
    sendSuccess(res, 200, 'Influencer profile retrieved successfully', { influencer: payload });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Active Influencers
 * Return influencers where collaboration status is 'in_progress' or 'live'
 */
exports.getActiveInfluencers = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    
    // Instead of querying Users directly, we query Collaborations to get Campaign and Influencer context together
    const collaborations = await Collaboration.findAll({
      where: {
        ownerId,
        status: { [require('sequelize').Op.in]: ['in_progress', 'live'] }
      },
      include: [
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'status'],
          include: [{
            model: InfluencerProfile,
            as: 'influencerProfile',
            attributes: ['id', 'image', 'bio', 'primaryPlatform', 'followersCount']
          }]
        },
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'campaignName', 'endDate']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedResults = collaborations.map(collab => ({
      collaborationId: collab.id,
      status: collab.status,
      influencer: {
        id: collab.influencer.id,
        firstName: collab.influencer.firstName,
        lastName: collab.influencer.lastName,
        email: collab.influencer.email,
        profileImage: collab.influencer.influencerProfile?.image || null,
        primaryPlatform: collab.influencer.influencerProfile?.primaryPlatform || null,
        followersCount: collab.influencer.influencerProfile?.followersCount || null
      },
      campaign: {
        id: collab.campaign.id,
        title: collab.campaign.campaignName,
        endDate: collab.campaign.endDate
      }
    }));

    sendSuccess(res, 200, 'Active influencers retrieved successfully', {
      collaborations: formattedResults
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Past Influencers
 * Return influencers where collaboration status is 'completed'
 */
exports.getPastInfluencers = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    const collaborations = await Collaboration.findAll({
      where: {
        ownerId,
        status: 'completed'
      },
      include: [
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'status'],
          include: [{
            model: InfluencerProfile,
            as: 'influencerProfile',
            attributes: ['id', 'image', 'bio', 'primaryPlatform', 'followersCount']
          }]
        },
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'campaignName', 'endDate']
        }
      ],
      order: [['completedAt', 'DESC NULLS LAST'], ['createdAt', 'DESC']]
    });

    const formattedResults = collaborations.map(collab => ({
      collaborationId: collab.id,
      status: collab.status,
      completedAt: collab.completedAt,
      influencer: {
        id: collab.influencer.id,
        firstName: collab.influencer.firstName,
        lastName: collab.influencer.lastName,
        email: collab.influencer.email,
        profileImage: collab.influencer.influencerProfile?.image || null,
        primaryPlatform: collab.influencer.influencerProfile?.primaryPlatform || null,
        followersCount: collab.influencer.influencerProfile?.followersCount || null
      },
      campaign: {
        id: collab.campaign.id,
        title: collab.campaign.campaignName,
        endDate: collab.campaign.endDate
      }
    }));

    sendSuccess(res, 200, 'Past influencers retrieved successfully', {
      collaborations: formattedResults
    });
  } catch (error) {
    next(error);
  }
};
