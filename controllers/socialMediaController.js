const { Channel, ScheduledPost } = require('../models');
const PlatformFactory = require('../services/channels/platformFactory');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/sendSuccess');
const crypto = require('crypto');

exports.getAuthUrl = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const userId = req.user.id;

    const supportedPlatforms = PlatformFactory.getSupportedPlatforms();
    if (!supportedPlatforms.includes(platform.toLowerCase())) {
      return next(new AppError(`Unsupported platform: ${platform}`, 400));
    }

    const state = crypto.randomBytes(32).toString('hex');
  
    const stateWithUserId = `${userId}:${state}`;

    const platformService = PlatformFactory.getService(platform);

    const redirectUri = process.env[`${platform.toUpperCase()}_REDIRECT_URI`] || 
                       `${req.protocol}://${req.get('host')}/api/social-media/${platform}/callback`;

    const authUrl = platformService.getAuthorizationUrl(redirectUri, stateWithUserId);

    return sendSuccess(res, {
      authUrl,
      state: stateWithUserId,
      platform
    }, 200);
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};


exports.handleCallback = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { code, state } = req.query;
    const userId = req.user.id;

    if (!code) {
      return next(new AppError('Authorization code is required', 400));
    }

    // Verify state
    const [stateUserId, stateToken] = state.split(':');
    if (stateUserId !== userId.toString()) {
      return next(new AppError('Invalid state parameter', 400));
    }

    // Get platform service
    const platformService = PlatformFactory.getService(platform);
    
    // Get redirect URI
    const redirectUri = process.env[`${platform.toUpperCase()}_REDIRECT_URI`] || 
                       `${req.protocol}://${req.get('host')}/api/social-media/${platform}/callback`;

    // Exchange code for token
    const tokenData = await platformService.exchangeCodeForToken(code, redirectUri);

    // Get account information
    const accountInfo = await platformService.getAccountInfo(tokenData.accessToken);

    // Calculate token expiration
    const tokenExpiresAt = tokenData.expiresIn 
      ? new Date(Date.now() + tokenData.expiresIn * 1000)
      : null;

    // Save or update account
    const [account, created] = await Channel.findOrCreate({
      where: {
        userId: userId,
        platform: platform.toLowerCase(),
        accountId: accountInfo.accountId
      },
      defaults: {
        userId: userId,
        platform: platform.toLowerCase(),
        accountId: accountInfo.accountId,
        accountName: accountInfo.accountName,
        accountUsername: accountInfo.accountUsername,
        profilePicture: accountInfo.profilePicture,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || null,
        tokenExpiresAt: tokenExpiresAt,
        platformData: accountInfo.platformData || {},
        isActive: true,
        lastSyncAt: new Date()
      }
    });

    // Update if already exists
    if (!created) {
      await account.update({
        accountName: accountInfo.accountName,
        accountUsername: accountInfo.accountUsername,
        profilePicture: accountInfo.profilePicture,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || account.refreshToken,
        tokenExpiresAt: tokenExpiresAt,
        platformData: accountInfo.platformData || account.platformData,
        isActive: true,
        lastSyncAt: new Date()
      });
    }

    return sendSuccess(res, {
      account: {
        id: account.id,
        platform: account.platform,
        accountName: account.accountName,
        accountUsername: account.accountUsername,
        profilePicture: account.profilePicture,
        isActive: account.isActive
      },
      message: created ? 'Account connected successfully' : 'Account reconnected successfully'
    }, created ? 201 : 200);
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

/**
 * Get all connected accounts for user
 */
exports.getAccounts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { platform } = req.query;

    const where = { userId };
    if (platform) {
      where.platform = platform.toLowerCase();
    }

    const accounts = await Channel.findAll({
      where,
      attributes: {
        exclude: ['accessToken', 'refreshToken'] 
      },
      order: [['createdAt', 'DESC']]
    });

    return sendSuccess(res, {
      accounts,
      count: accounts.length
    }, 200);
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

/**
 * Get single account
 */
exports.getAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const account = await Channel.findOne({
      where: {
        id,
        userId
      },
      attributes: {
        exclude: ['accessToken', 'refreshToken']
      }
    });

    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    return sendSuccess(res, { account }, 200);
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

/**
 * Disconnect/delete account
 */
exports.disconnectAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const account = await Channel.findOne({
      where: {
        id,
        userId
      }
    });

    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    // Try to revoke token on platform
    try {
      const platformService = PlatformFactory.getService(account.platform);
      await platformService.disconnect(account.accessToken);
    } catch (error) {
      console.error('Error disconnecting from platform:', error);
      // Continue with deletion even if platform disconnect fails
    }

    // Delete account
    await account.destroy();

    return sendSuccess(res, {
      message: 'Account disconnected successfully'
    }, 200);
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

/**
 * Refresh account token
 */
exports.refreshAccountToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const account = await Channel.findOne({
      where: {
        id,
        userId
      }
    });

    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    if (!account.refreshToken) {
      return next(new AppError('Refresh token not available for this account', 400));
    }

    const platformService = PlatformFactory.getService(account.platform);
    const tokenData = await platformService.refreshToken(account.refreshToken);

    const tokenExpiresAt = tokenData.expiresIn 
      ? new Date(Date.now() + tokenData.expiresIn * 1000)
      : null;

    await account.update({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken || account.refreshToken,
      tokenExpiresAt: tokenExpiresAt,
      lastSyncAt: new Date()
    });

    return sendSuccess(res, {
      message: 'Token refreshed successfully'
    }, 200);
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

