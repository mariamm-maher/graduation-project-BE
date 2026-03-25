const { User, OwnerProfile, InfluencerProfile } = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');

const calculateAndUpdateCompletion = async (profile, modelName) => {
  let fieldsToCheck = [];

  if (modelName === 'OwnerProfile') {
    fieldsToCheck = [
      'businessName', 'businessType', 'industry', 'location', 'description',
      'image', 'website', 'phoneNumber', 'platformsUsed', 'primaryMarketingGoal',
      'targetAudience'
    ];
  } else if (modelName === 'InfluencerProfile') {
    fieldsToCheck = [
      'bio', 'image', 'location', 'socialMediaLinks', 'primaryPlatform',
      'followersCount', 'engagementRate', 'categories', 'contentTypes',
      'collaborationTypes', 'audienceAgeRange', 'audienceGender', 'audienceLocation',
      'interests'
    ];
  }

  const totalFields = fieldsToCheck.length;
  let filledFields = 0;

  fieldsToCheck.forEach(field => {
    const value = profile[field];
    if (value !== null && value !== undefined) {
      if (typeof value === 'string') {
        if (value.trim() !== '') filledFields++;
      } else if (Array.isArray(value)) {
        if (value.length > 0) filledFields++;
      } else if (typeof value === 'object' && value !== null) {
        if (Object.keys(value).length > 0) filledFields++;
      } else {
        filledFields++;
      }
    }
  });

  const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  await profile.update({
    completionPercentage: percentage,
    isCompleted: percentage === 100
  });

  return percentage;
};

// @desc    Get authenticated owner profile
// @route   GET /api/profile/owner
// @access  Private (owner only)
exports.getOwnerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'status'],
      include: [{
        model: OwnerProfile,
        as: 'ownerProfile',  
        required: false      
      }]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const profileData = user.ownerProfile || {};

    const combinedProfile = {
      ...user.dataValues,         
      ownerProfile: profileData   
    };

    sendSuccess(res, 200, 'Owner profile retrieved', { profile: combinedProfile });
  } catch (error) {
    next(error);
  }
};

// (Owner profile creation endpoint removed - use PUT /api/profile/owner to create or update)

// @desc    Update owner profile
// @route   PUT /api/profile/owner
// @access  Private (owner only)
exports.updateOwnerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profile = await OwnerProfile.findOne({ where: { userId } });

    if (!profile) {
      return next(new AppError('Owner profile not found', 404));
    }

    const user = await User.findByPk(userId);

    const userFields = ['firstName', 'lastName', 'email']; 

    const userUpdateData = {};

    userFields.forEach(field => {
      if (req.body[field] !== undefined) {
        userUpdateData[field] = req.body[field];
      }
    });

    if (Object.keys(userUpdateData).length > 0) {
      await user.update(userUpdateData);
    }

    const profileUpdateData = { ...req.body };
    userFields.forEach(field => delete profileUpdateData[field]); 

    if (Object.keys(profileUpdateData).length > 0) {
      await profile.update(profileUpdateData);
    }

    const percentage = await calculateAndUpdateCompletion(profile, 'OwnerProfile');

    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email'], 
      include: [{
        model: OwnerProfile,
        as: 'ownerProfile'
      }]
    });

    const combinedProfile = {
      ...updatedUser.dataValues,
      ownerProfile: updatedUser.ownerProfile || {}
    };

    sendSuccess(res, 200, 'Owner profile updated', { 
      profile: combinedProfile,
      completionPercentage: percentage 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete owner profile
// @route   DELETE /api/profile/owner
// @access  Private (owner only)
exports.deleteOwnerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await user.destroy();

    sendSuccess(res, 200, 'Owner account and profile deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated influencer profile
// @route   GET /api/profile/influencer
// @access  Private (influencer only)
exports.getInfluencerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'status'],
      include: [{
        model: InfluencerProfile,
        as: 'influencerProfile',  
        required: false      
      }]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const profileData = user.influencerProfile || {};

    const combinedProfile = {
      ...user.dataValues,         
      influencerProfile: profileData   
    };

    sendSuccess(res, 200, 'Influencer profile retrieved', { profile: combinedProfile });
  } catch (error) {
    next(error);
  }
};

// (Influencer profile creation endpoint removed - use PUT /api/profile/influencer to create or update)

// @desc    Update influencer profile
// @route   PUT /api/profile/influencer
// @access  Private (influencer only)
exports.updateInfluencerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profile = await InfluencerProfile.findOne({ where: { userId } });

    if (!profile) {
      return next(new AppError('Influencer profile not found', 404));
    }

    const user = await User.findByPk(userId);

    const userFields = ['firstName', 'lastName', 'email']; 

    const userUpdateData = {};

    userFields.forEach(field => {
      if (req.body[field] !== undefined) {
        userUpdateData[field] = req.body[field];
      }
    });

    if (Object.keys(userUpdateData).length > 0) {
      await user.update(userUpdateData);
    }

    const profileUpdateData = { ...req.body };
    userFields.forEach(field => delete profileUpdateData[field]); 

    if (Object.keys(profileUpdateData).length > 0) {
      await profile.update(profileUpdateData);
    }

    const percentage = await calculateAndUpdateCompletion(profile, 'InfluencerProfile');

    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email'], 
      include: [{
        model: InfluencerProfile,
        as: 'influencerProfile'
      }]
    });

    const combinedProfile = {
      ...updatedUser.dataValues,
      influencerProfile: updatedUser.influencerProfile || {}
    };

    sendSuccess(res, 200, 'Influencer profile updated', { 
      profile: combinedProfile,
      completionPercentage: percentage 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete influencer profile (and user account)
// @route   DELETE /api/profile/influencer
// @access  Private (influencer only)
exports.deleteInfluencerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await user.destroy();

    sendSuccess(res, 200, 'Influencer account and profile deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get profile completion status 
// @route   GET /api/profile/owner/completion
// @access  Private (owner only)
exports.getOwnerProfileCompletion = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profile = await OwnerProfile.findOne({ where: { userId } });
    if (!profile) {
      return sendSuccess(res, 200, 'No owner profile found', {
        completed: false,
        percentage: 0,
        missingFields: []
      });
    }

    const fieldsToCheck = [
      'businessName', 'businessType', 'industry', 'location', 'description',
      'image', 'website', 'phoneNumber', 'platformsUsed', 'primaryMarketingGoal',
      'targetAudience'
    ];

    let totalFields = fieldsToCheck.length;
    let filledFields = 0;

    fieldsToCheck.forEach(field => {
      const value = profile[field];
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          if (value.trim() !== '') filledFields++;
        } else if (Array.isArray(value)) {
          if (value.length > 0) filledFields++;
        } else if (typeof value === 'object' && value !== null) {
          if (Object.keys(value).length > 0) filledFields++;
        } else {
          filledFields++;
        }
      }
    });

    const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    const missingFields = fieldsToCheck.filter(field => {
      const value = profile[field];
      return value === null || value === undefined ||
             (typeof value === 'string' && value.trim() === '') ||
             (Array.isArray(value) && value.length === 0) ||
             (typeof value === 'object' && value !== null && Object.keys(value).length === 0);
    });

    sendSuccess(res, 200, 'Owner profile completion status', {
      completed: percentage === 100,
      percentage,
      filledFields,
      totalFields,
      missingFields: missingFields.length > 0 ? missingFields : undefined
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get profile completion status 
// @route   GET /api/profile/influencer/completion
// @access  Private (influencer only)
exports.getInfluencerProfileCompletion = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profile = await InfluencerProfile.findOne({ where: { userId } });
    if (!profile) {
      return sendSuccess(res, 200, 'No influencer profile found', {
        completed: false,
        percentage: 0,
        missingFields: []
      });
    }

    const fieldsToCheck = [
      'bio', 'image', 'location', 'socialMediaLinks', 'primaryPlatform',
      'followersCount', 'engagementRate', 'categories', 'contentTypes',
      'collaborationTypes', 'audienceAgeRange', 'audienceGender', 'audienceLocation',
      'interests'
    ];

    let totalFields = fieldsToCheck.length;
    let filledFields = 0;

    fieldsToCheck.forEach(field => {
      const value = profile[field];
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          if (value.trim() !== '') filledFields++;
        } else if (Array.isArray(value)) {
          if (value.length > 0) filledFields++;
        } else if (typeof value === 'object' && value !== null) {
          if (Object.keys(value).length > 0) filledFields++;
        } else {
          filledFields++;
        }
      }
    });

    const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    const missingFields = fieldsToCheck.filter(field => {
      const value = profile[field];
      return value === null || value === undefined ||
             (typeof value === 'string' && value.trim() === '') ||
             (Array.isArray(value) && value.length === 0) ||
             (typeof value === 'object' && value !== null && Object.keys(value).length === 0);
    });

    sendSuccess(res, 200, 'Influencer profile completion status', {
      completed: percentage === 100,
      percentage,
      filledFields,
      totalFields,
      missingFields: missingFields.length > 0 ? missingFields : undefined
    });
  } catch (error) {
    next(error);
  }
};