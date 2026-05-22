const express = require('express');
const tiktokAuthService = require('../services/channels/tiktokAuthService');
const { authenticate: authMiddleware } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

/**
 * @swagger
 * /auth/tiktok:
 *   get:
 *     summary: Redirect user to TikTok OAuth dialog
 *     tags: [Auth - TikTok]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Redirects to real TikTok Login Kit OAuth.
 *       Scopes: user.info.profile, user.info.stats.
 *       Publishing posts is simulated (requires separate TikTok API review).
 *       Test this in a browser — not Postman.
 *     responses:
 *       302:
 *         description: Redirect to TikTok OAuth
 *       401:
 *         description: Unauthorized
 */
router.get('/tiktok', async (req, res, next) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard/owner/social-media/accounts?error=missing_user`
      );
    }
    const url = await tiktokAuthService.getOAuthUrl(userId);
    console.log('TikTok OAuth URL:', url);
    return res.redirect(url);
  } catch (err) {
    return next(err);
  }
});

/**
 * @swagger
 * /auth/tiktok/callback:
 *   get:
 *     summary: TikTok OAuth callback
 *     tags: [Auth - TikTok]
 *     description: >
 *       Called automatically by TikTok after user approves.
 *       Exchanges code for real tokens, fetches real user profile,
 *       saves as channel. Do not call manually.
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Set by TikTok if user denied access
 *     responses:
 *       302:
 *         description: Redirect to frontend dashboard
 */
router.get('/auth/tiktok/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/owner/social-media/accounts?error=tiktok_denied`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/owner/social-media/accounts?error=missing_params`);
    }

    const userId = Number(state);
    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/owner/social-media/accounts?error=invalid_state`);
    }

    const channel = await tiktokAuthService.handleCallback(code, userId);

    await notificationService.createNotification({
      userId,
      type: 'CHANNEL_CONNECTED',
      message: `TikTok account @${channel.accountUsername} connected successfully`,
      entityType: 'channel',
      metadata: { platform: 'tiktok', simulated: false, canPost: false }
    });

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/owner/social-media/accounts?connected=true&platform=tiktok`);
  } catch (err) {
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/owner/social-media/accounts?error=tiktok_auth_failed`);
  }
});

module.exports = router;
