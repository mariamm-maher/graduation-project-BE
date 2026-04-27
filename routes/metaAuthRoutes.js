const express = require('express');
const metaAuthService = require('../services/channels/metaAuthService');
const { authenticate: authMiddleware } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const { verifyAccessToken } = require('../utils/generateToken');

const router = express.Router();

// GET /auth/meta  — redirect user to Meta OAuth
router.get('/meta', authMiddleware, async (req, res, next) => {
  try {
    const url = await metaAuthService.getOAuthUrl(req.user.id, req.accessToken);
    return res.redirect(url);
  } catch (err) {
    return next(err);
  }
});

// GET /auth/meta-url  — return Meta OAuth URL as JSON (frontend redirects)
router.get('/meta-url', authMiddleware, async (req, res, next) => {
  try {
    const url = await metaAuthService.getOAuthUrl(req.user.id, req.accessToken);
    return res.status(200).json({ data: { url } });
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/dashboard/channels?error=meta_failed`);
    }

    const verify = verifyAccessToken(String(state));
    if (!verify.valid || !verify.decoded?.id) {
      return res.redirect(`${frontendUrl}/dashboard/channels?error=meta_failed`);
    }

    const userId = verify.decoded.id;
    const result = await metaAuthService.handleCallback(code, userId);

    await notificationService.createNotification({
      userId,
      type: 'CAMPAIGN_PUBLISHED',
      message:    `${result.channelsAdded} Meta channel(s) connected successfully`,
      entityType: 'channel',
      metadata:   { platform: 'meta', channelsAdded: result.channelsAdded }
    });

    return res.redirect(`${frontendUrl}/dashboard/channels?success=true`);
  } catch (err) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/dashboard/channels?error=meta_failed`);
  }
});

module.exports = router;