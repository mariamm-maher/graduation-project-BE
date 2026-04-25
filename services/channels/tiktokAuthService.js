const channelService = require('./channelService');

async function simulateConnect(userId) {
  return channelService.createChannel({
    userId,
    platform: 'tiktok',
    accountId: `tiktok_sim_${Date.now()}`,
    accountName: 'My TikTok Account',
    accountUsername: '@mytiktok',
    profilePicture: null,
    accessToken: `sim_access_${Date.now()}`,
    refreshToken: `sim_refresh_${Date.now()}`,
    tokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    platformData: { isSimulated: true }
  });
}

module.exports = { simulateConnect };
