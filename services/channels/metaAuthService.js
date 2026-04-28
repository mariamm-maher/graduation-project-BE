const axios = require('axios');
const channelService = require('./channelService');
const jwt = require('jsonwebtoken');

const OAUTH_BASE_URL = 'https://www.facebook.com/v19.0/dialog/oauth';
const SHORT_TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token';
const LONG_TOKEN_URL = 'https://graph.facebook.com/oauth/access_token';
const GRAPH_BASE_URL = 'https://graph.facebook.com/v19.0';
const SCOPES = [
  'public_profile',
  'pages_show_list',
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_manage_metadata',
  'pages_read_user_content'
].join(',');

function getMetaEnv() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return {
    appId: process.env.META_APP_ID || process.env.FB_APP_ID,
    appSecret: process.env.META_APP_SECRET || process.env.FB_APP_SECRET,
    redirectUri:
      process.env.META_REDIRECT_URI ||
      process.env.FB_REDIRECT_URI ||
      `${backendUrl}/auth/meta/callback`
  };
}

async function getOAuthUrl(userId, stateToken) {
  const { appId, redirectUri } = getMetaEnv();
  const oauthState =
    stateToken ||
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '15m'
    });

  const params = new URLSearchParams({
    client_id: appId || '',
    redirect_uri: redirectUri || '',
    scope: SCOPES,
    state: oauthState,
    response_type: 'code'
  });

  return `${OAUTH_BASE_URL}?${params.toString()}`;
}

async function handleCallback(code, userId) {
  const { appId, appSecret, redirectUri } = getMetaEnv();

  const shortLivedResponse = await axios.get(SHORT_TOKEN_URL, {
    params: {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code
    }
  });

  const shortLivedToken = shortLivedResponse.data?.access_token;
  if (!shortLivedToken) {
    throw new Error('Failed to exchange code for short-lived token');
  }

  const longLivedResponse = await axios.get(LONG_TOKEN_URL, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken
    }
  });

  const longLivedToken = longLivedResponse.data?.access_token;
  if (!longLivedToken) {
    throw new Error('Failed to exchange token for long-lived token');
  }

  const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const pagesResponse = await axios.get(`${GRAPH_BASE_URL}/me/accounts`, {
    params: {
      fields: 'id,name,access_token',
      access_token: longLivedToken
    }
  });

  const pages = pagesResponse.data?.data || [];
  let channelsAdded = 0;

  for (const page of pages) {
    let pageStats = {};
    try {
      const statsRes = await axios.get(`${GRAPH_BASE_URL}/${page.id}`, {
        params: {
          fields: 'fan_count,engagement',
          access_token: page.access_token
        }
      });
      pageStats = {
        followers: statsRes.data?.fan_count ?? null,
        engagement: statsRes.data?.engagement ?? null
      };
    } catch (statsErr) {
      pageStats = {};
    }

    await channelService.createChannel({
      userId,
      platform: 'facebook',
      accountId: page.id,
      accountName: page.name,
      accessToken: page.access_token,
      tokenExpiresAt,
      platformData: { isSimulated: false, ...pageStats }
    });
    channelsAdded += 1;

    try {
      const pageDataResponse = await axios.get(`${GRAPH_BASE_URL}/${page.id}`, {
        params: {
          fields: 'instagram_business_account',
          access_token: page.access_token
        }
      });

      const igAccount = pageDataResponse.data?.instagram_business_account;
      if (!igAccount?.id) {
        continue;
      }

      const igResponse = await axios.get(`${GRAPH_BASE_URL}/${igAccount.id}`, {
        params: {
          fields: 'id,name,username,profile_picture_url',
          access_token: page.access_token
        }
      });

      const ig = igResponse.data;
      await channelService.createChannel({
        userId,
        platform: 'instagram',
        accountId: ig.id,
        accountName: ig.name,
        accountUsername: ig.username,
        profilePicture: ig.profile_picture_url,
        accessToken: page.access_token,
        tokenExpiresAt,
        platformData: { isSimulated: false }
      });
      channelsAdded += 1;
    } catch (igErr) {
      // Keep Facebook page connection working even when Instagram permission is missing.
      console.warn('[META AUTH] Instagram link skipped:', igErr.response?.data?.error?.message || igErr.message);
    }
  }

  return { channelsAdded };
}

module.exports = {
  getOAuthUrl,
  handleCallback
};
