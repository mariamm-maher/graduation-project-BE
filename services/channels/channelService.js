const { Op } = require('sequelize');
const Channel = require('../../models/channel');
const ScheduledPost = require('../../models/ScheduledPost');

class ChannelService {

  async createChannel(payload) {
    const where = {
      userId: payload.userId,
      platform: payload.platform,
      accountId: String(payload.accountId)
    };
    const defaults = {
      userId:          payload.userId,
      platform:        payload.platform,
      accountId:       String(payload.accountId),
      accountName:     payload.accountName     || null,
      accountUsername: payload.accountUsername || null,
      profilePicture:  payload.profilePicture  || null,
      accessToken:     payload.accessToken,
      refreshToken:    payload.refreshToken    || null,
      tokenExpiresAt:  payload.tokenExpiresAt  || null,
      platformData:    payload.platformData    || {},
      status:          'active',
      lastSyncAt:      new Date()
    };
    const [channel, created] = await Channel.findOrCreate({ where, defaults });
    if (!created) {
      await channel.update({ ...defaults, lastSyncAt: new Date() });
    }
    return channel;
  }

  async getUserChannels(userId) {
    const channels = await Channel.findAll({
      where: { userId },
      attributes: [
        'id', 'platform', 'accountName', 'accountUsername',
        'profilePicture', 'status', 'platformData', 'lastSyncAt', 'createdAt'
      ],
      order: [['createdAt', 'DESC']],
    });
    console.log('[CHANNELS] Found:', channels.length, 'channels');
    return channels;
  }

  async getChannelById(channelId, userId) {
    const channel = await Channel.findOne({
      where: { id: channelId, userId }
    });
    if (!channel) {
      const err = new Error('Channel not found');
      err.status = 404;
      throw err;
    }
    return channel;
  }

  async updateChannelTokens(channelId, { accessToken, refreshToken, tokenExpiresAt }) {
    const channel = await Channel.findByPk(channelId);
    if (!channel) {
      const err = new Error('Channel not found');
      err.status = 404;
      throw err;
    }
    await channel.update({ accessToken, refreshToken, tokenExpiresAt, lastSyncAt: new Date() });
    return channel;
  }

  async updateChannelStatus(channelId, status) {
    const channel = await Channel.findByPk(channelId);
    if (!channel) {
      const err = new Error('Channel not found');
      err.status = 404;
      throw err;
    }
    await channel.update({ status, lastSyncAt: new Date() });
    return channel;
  }

  async deleteChannel(channelId, userId) {
    // Block deletion if pending posts exist on this channel
    const pendingCount = await ScheduledPost.count({
      where: {
        channelId,
        status: {
          [Op.in]: ['draft', 'scheduled']
        }
      }
    });
    if (pendingCount > 0) {
      const err = new Error('Channel has pending posts. Cancel them first.');
      err.status = 400;
      throw err;
    }
    const deleted = await Channel.destroy({ where: { id: channelId, userId } });
    if (deleted === 0) {
      const err = new Error('Channel not found');
      err.status = 404;
      throw err;
    }
    return { success: true };
  }

  // Used by tokenRefresher job
  async getExpiringChannels() {
    return Channel.findAll({
      where: {
        status: 'active',
        tokenExpiresAt: {
          [Op.lte]: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        }
      }
    });
    // Filter out simulated in the job itself using platformData.isSimulated
  }

  // Used by token refresh route
  async refreshToken(channelId, userId) {
    const channel = await this.getChannelById(channelId, userId);

    // 1) Real TikTok channels
    if (channel.platform === 'tiktok' && channel.platformData?.isSimulated !== true) {
      const tokens = await tiktokAuthService.refreshTikTokToken(channel);
      return this.updateChannelTokens(channelId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + Number(tokens.expires_in || 0) * 1000)
      });
    }

    // 2) Real YouTube channels
    if (channel.platform === 'youtube' && channel.platformData?.isSimulated !== true) {
      const tokens = await youtubeAuthService.refreshYouTubeToken(channel);
      return this.updateChannelTokens(channelId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + Number(tokens.expires_in || 3600) * 1000)
      });
    }

    // 3) Simulated channels (any platform) — just extend expiry, no API call
    if (channel.platformData?.isSimulated === true) {
      const tokenExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      return this.updateChannelTokens(channelId, {
        accessToken:  channel.accessToken,
        refreshToken: channel.refreshToken,
        tokenExpiresAt
      });
    }

    // 3) Real Meta channels
    if (channel.platform === 'facebook' || channel.platform === 'instagram') {
      const axios = require('axios');
      const response = await axios.get('https://graph.facebook.com/oauth/access_token', {
        params: {
          grant_type:        'fb_exchange_token',
          client_id:         process.env.META_APP_ID,
          client_secret:     process.env.META_APP_SECRET,
          fb_exchange_token: channel.accessToken
        }
      });
      const accessToken    = response.data?.access_token;
      const expiresIn      = response.data?.expires_in;
      const tokenExpiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      return this.updateChannelTokens(channelId, {
        accessToken,
        refreshToken: channel.refreshToken,
        tokenExpiresAt
      });
    }

    // 5) Fallback
    return channel;
  }
}

module.exports = new ChannelService();