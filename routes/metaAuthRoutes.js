const express = require('express');
const metaAuthService = require('../services/channels/metaAuthService');
const { authenticate: authMiddleware } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const { verifyAccessToken } = require('../utils/generateToken');

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

// GET /auth/meta-url  — return Meta OAuth URL as JSON (frontend redirects)
router.get('/meta-url', authMiddleware, async (req, res, next) => {
  try {
    const url = await metaAuthService.getOAuthUrl(req.user.id);
    return res.status(200).json({ data: { url } });
  } catch (err) {
    return next(err);
  }
});

// GET /auth/meta/callback  — Meta redirects here after user approves
// NOTE: No authMiddleware here — user arrives from Meta with no JWT
// Security is handled by validating the state param (contains userId)
router.get('/meta/callback', async (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/dashboard/owner/social-media/accounts?error=meta_failed`);
    }

    console.log('[META CALLBACK] code received:', !!code);
    console.log('[META CALLBACK] state received:', state?.substring(0, 20) + '...');
    const verify = verifyAccessToken(String(state));
    console.log('[META CALLBACK] verify result:', verify.valid, verify.decoded?.id);

    if (!verify.valid || !verify.decoded?.id) {
      console.error('[META CALLBACK] State JWT invalid:', verify.error);
      return res.redirect(`${frontendUrl}/dashboard/owner/social-media/accounts?error=meta_failed`);
    }

    const userId = verify.decoded.id;
    const result = await metaAuthService.handleCallback(code, userId);

    if (result.channelsAdded === 0) {
      console.warn('[META CALLBACK] 0 channels saved — user may have no Facebook Pages or missing permissions');
      return res.redirect(`${frontendUrl}/dashboard/owner/social-media/accounts?error=no_pages`);
    }

    try {
      await notificationService.createNotification({
        userId,
        type: 'CHANNEL_CONNECTED',
        message: `${result.channelsAdded} Meta channel(s) connected successfully`,
        entityType: 'channel',
        metadata: { platform: 'meta', channelsAdded: result.channelsAdded }
      });
    } catch (notifErr) {
      console.error('[META CALLBACK] Notification failed (non-fatal):', notifErr.message);
    }

    return res.redirect(`${frontendUrl}/dashboard/owner/social-media/accounts?connected=true`);
  } catch (err) {
    console.error('[META CALLBACK ERROR]', err.message);
    console.error('[META CALLBACK STACK]', err.stack);
    const fe = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${fe}/dashboard/owner/social-media/accounts?error=meta_failed`);
  }
});

module.exports = router;
