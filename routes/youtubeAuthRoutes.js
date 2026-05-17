const express = require('express');
const youtubeAuthService = require('../services/channels/youtubeAuthService');
const { authenticate: authMiddleware } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

const frontendBase = () => process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * @swagger
 * /auth/youtube:
 *   get:
 *     summary: Redirect user to Google OAuth for YouTube (readonly scope)
 *     tags: [Auth - YouTube]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Starts OAuth with scope youtube.readonly; upload is not enabled.
 *       Test in a browser with a valid JWT (cookie or Authorization header).
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 *       401:
 *         description: Unauthorized
 */
router.get('/youtube', authMiddleware, async (req, res, next) => {
  try {
    const url = await youtubeAuthService.getOAuthUrl(req.user.id);
    return res.redirect(url);
  } catch (err) {
    return next(err);
  }
});

/**
 * @swagger
 * /auth/youtube-url:
 *   get:
 *     summary: Return YouTube OAuth URL as JSON (frontend redirects)
 *     tags: [Auth - YouTube]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth URL for Google / YouTube consent
 *       401:
 *         description: Unauthorized
 */
router.get('/youtube-url', authMiddleware, async (req, res, next) => {
  try {
    const url = await youtubeAuthService.getOAuthUrl(req.user.id);
    return res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * @swagger
 * /auth/youtube/callback:
 *   get:
 *     summary: Google OAuth callback for YouTube connection
 *     tags: [Auth - YouTube]
 *     description: >
 *       Called by Google after consent. No JWT — validates code and state (user id).
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
 *         description: Set by Google if user denied access
 *     responses:
 *       302:
 *         description: Redirect to frontend channels dashboard
 */
router.get('/youtube/callback', async (req, res) => {
  const fe = frontendBase();
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${fe}/dashboard/owner/social-media/accounts?error=youtube_denied`);
    }

    if (!code || !state) {
      return res.redirect(`${fe}/dashboard/owner/social-media/accounts?error=missing_params`);
    }

    const userId = Number(state);
    if (!userId) {
      return res.redirect(`${fe}/dashboard/owner/social-media/accounts?error=invalid_state`);
    }

    const channel = await youtubeAuthService.handleCallback(code, userId);

    await notificationService.createNotification({
      userId,
      type: 'CHANNEL_CONNECTED',
      message: `YouTube channel "${channel.accountName}" connected successfully`,
      entityType: 'channel',
      metadata: { platform: 'youtube', simulated: false },
    });

    return res.redirect(
      `${fe}/dashboard/owner/social-media/accounts?connected=true&platform=youtube`
    );
  } catch (err) {
    console.error('[YOUTUBE CALLBACK ERROR]', err.message);
    console.error('[YOUTUBE CALLBACK STACK]', err.stack);
    console.error('[YOUTUBE CALLBACK RESPONSE]', err.response?.data);
    return res.redirect(`${fe}/dashboard/owner/social-media/accounts?error=youtube_auth_failed`);
  }
});

module.exports = router;
