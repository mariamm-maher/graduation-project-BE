const express = require('express');
const metaAuthService = require('../services/channels/metaAuthService');
const { authenticate: authMiddleware } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

// GET /auth/meta  — redirect user to Meta OAuth
router.get('/meta', authMiddleware, async (req, res, next) => {
  try {
    const url = await metaAuthService.getOAuthUrl(req.user.id);
    return res.redirect(url);
  } catch (err) {
    return next(err);
  }
});

// GET /auth/meta/callback  — Meta redirects here after user approves
// NOTE: No authMiddleware here — user arrives from Meta with no JWT
// Security is handled by validating the state param (contains userId)
router.get('/meta/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/channels?error=missing_params`);
    }

    const userId = Number(state);
    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/channels?error=invalid_state`);
    }

    const result = await metaAuthService.handleCallback(code, userId);

    await notificationService.createNotification({
      userId,
      type:       'CHANNEL_CONNECTED',
      message:    `${result.channelsAdded} Meta channel(s) connected successfully`,
      entityType: 'channel',
      metadata:   { platform: 'meta', channelsAdded: result.channelsAdded }
    });

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/channels?connected=true`);
  } catch (err) {
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/channels?error=meta_auth_failed`);
  }
});

module.exports = router;