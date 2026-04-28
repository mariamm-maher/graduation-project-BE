const channelService = require('../services/channels/channelService');
const notificationService = require('../services/notificationService');
const axios = require('axios');
const cron = require('node-cron');

async function handler() {
  const channels = await channelService.getExpiringChannels();
  let refreshed = 0;
  let failed = 0;

  for (const channel of channels) {
    if (channel.platformData?.isSimulated === true) {
      continue;
    }

    if (channel.platform === 'facebook' || channel.platform === 'instagram') {
      try {
        const res = await axios.get('https://graph.facebook.com/oauth/access_token', {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            fb_exchange_token: channel.accessToken
          }
        });

        await channelService.updateChannelTokens(channel.id, {
          accessToken: res.data.access_token,
          refreshToken: channel.refreshToken,
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        });

        refreshed += 1;
        console.log('[TOKEN REFRESH] Refreshed channel', channel.id);
      } catch (err) {
        failed += 1;
        await channelService.updateChannelStatus(channel.id, 'expired');
        await notificationService.create({
          userId: channel.userId,
          title: 'Channel disconnected',
          message: `Your ${channel.platform} connection expired. Please reconnect.`,
          type: 'channel'
        });
        console.error('[TOKEN REFRESH] Failed for channel', channel.id);
      }
    }
  }

  console.log(`[TOKEN REFRESH] Done — refreshed ${refreshed}, failed ${failed}`);
}

function startTokenRefresher() {
  cron.schedule('0 */12 * * *', handler);
}

module.exports = { startTokenRefresher };
