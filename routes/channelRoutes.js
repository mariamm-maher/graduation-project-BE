const express = require('express');
const channelService = require('../services/channels/channelService');
const { authenticate: authMiddleware } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const axios = require('axios');

const router = express.Router();
router.use(authMiddleware);

// GET /channels
router.get('/', async (req, res) => {
  try {
    const channels = await channelService.getUserChannels(req.user.id);
    const mapped = channels.map((ch) => ({
      id: ch.id,
      platform: ch.platform,
      username: ch.accountUsername,
      name: ch.accountName,
      followersCount: ch.platformData?.followers ?? null,
      followers: ch.platformData?.followers ?? null,
      engagement: ch.platformData?.engagement ?? null,
      status: ch.status,
      profilePicture: ch.profilePicture,
      platformData: ch.platformData
    }));
    return res.status(200).json({ success: true, data: mapped });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// GET /channels/:id
router.get('/:id', async (req, res) => {
  try {
    const channel = await channelService.getChannelById(req.params.id, req.user.id);
    return res.status(200).json({ success: true, data: channel });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// DELETE /channels/:id
router.delete('/:id', async (req, res) => {
  try {
    await channelService.deleteChannel(req.params.id, req.user.id);
    await notificationService.createNotification({
      userId:     req.user.id,
      type:       'CAMPAIGN_PUBLISHED',
      message:    'A channel was disconnected',
      entityType: 'channel',
      entityId:   Number(req.params.id),
      metadata:   { action: 'channel_disconnected' }
    });
    return res.status(200).json({ success: true, message: 'Channel disconnected' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// GET /channels/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    const channel = await channelService.getChannelById(req.params.id, req.user.id);
    const graphRes = await axios.get(`https://graph.facebook.com/v19.0/${channel.accountId}`, {
      params: {
        fields: 'fan_count,engagement',
        access_token: channel.accessToken
      }
    });

    const updatedPlatformData = {
      ...(channel.platformData || {}),
      followers: graphRes.data?.fan_count ?? null,
      engagement: graphRes.data?.engagement ?? null,
      lastStatsSyncAt: new Date().toISOString()
    };
    await channel.update({ platformData: updatedPlatformData, lastSyncAt: new Date() });

    return res.status(200).json({
      success: true,
      data: {
        id: channel.id,
        platform: channel.platform,
        followersCount: graphRes.data?.fan_count ?? null,
        fan_count: graphRes.data?.fan_count ?? null,
        engagement: graphRes.data?.engagement ?? null
      }
    });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// POST /channels/:id/refresh-token
router.post('/:id/refresh-token', async (req, res) => {
  try {
    // All logic lives in the service
    const updatedChannel = await channelService.refreshToken(req.params.id, req.user.id);
    return res.status(200).json({ success: true, data: updatedChannel });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

module.exports = router;