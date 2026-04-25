const express = require('express');
const analyticsService = require('../services/analyticsService');
const { authenticate: authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/api/analytics/posts/:postId', async (req, res) => {
  try {
    const data = await analyticsService.getPostAnalytics(req.params.postId, req.user.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.get('/api/analytics/channels/:channelId', async (req, res) => {
  try {
    const data = await analyticsService.getChannelAnalytics(req.params.channelId, req.user.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.get('/api/analytics/campaigns/:campaignId', async (req, res) => {
  try {
    const data = await analyticsService.getCampaignAnalytics(req.params.campaignId, req.user.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

module.exports = router;
