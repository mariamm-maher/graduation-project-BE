const express = require('express');
const tiktokAuthService = require('../services/channels/tiktokAuthService');
const { authenticate: authMiddleware } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

router.get('/auth/tiktok', authMiddleware, async (req, res, next) => {
  try {
    const channel = await tiktokAuthService.simulateConnect(req.user.id);

    await notificationService.create({
      userId: req.user.id,
      title: 'TikTok connected',
      message: 'TikTok account connected (simulation mode)',
      type: 'channel'
    });

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/channels?connected=true&simulated=true`);
  } catch (err) {
    return next(err);
  }
});

router.get('/auth/tiktok/callback', (req, res) => {
  return res.status(200).json({ message: 'Simulation mode — not used' });
});

module.exports = router;
