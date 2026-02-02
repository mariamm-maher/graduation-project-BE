const { InfluencerProfile, User } = require('../models');
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
    
    const influencer = await InfluencerProfile.findOne({
      where: { 
        id,
        isOnboarded: true
      },
      include: [{
          model: User,
          as: 'user',
          // Expose only basic user info
          attributes: ['firstName', 'lastName', 'email', 'status'],
          where: { status: 'ACTIVE' },
          required: true
        }]
    });
    
    if (!influencer) {
      return next(new AppError('Influencer profile not found', 404));
    }
    
    sendSuccess(res, 200, 'Influencer profile retrieved successfully', {
      influencer: {
        user: {
          firstName: influencer.user.firstName,
          lastName: influencer.user.lastName,
          email: influencer.user.email,
          status: influencer.user.status
        },
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
        completionPercentage: influencer.completionPercentage
      }
    });
  } catch (error) {
    next(error);
  }
};
