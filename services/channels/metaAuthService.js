const axios = require('axios');
const channelService = require('./channelService');

const OAUTH_BASE_URL = 'https://www.facebook.com/v19.0/dialog/oauth';
const SHORT_TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token';
const LONG_TOKEN_URL = 'https://graph.facebook.com/oauth/access_token';
const GRAPH_BASE_URL = 'https://graph.facebook.com/v19.0';
const SCOPES = [
  'pages_manage_posts',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_content_publish',
  'pages_show_list',
  'pages_manage_metadata'
].join(',');

async function getOAuthUrl(userId) {
  const { META_APP_ID, META_REDIRECT_URI } = process.env;
  const params = new URLSearchParams({
    client_id: META_APP_ID || '',
    redirect_uri: META_REDIRECT_URI || '',
    scope: SCOPES,
    state: String(userId)
  });

  return `${OAUTH_BASE_URL}?${params.toString()}`;
}

async function handleCallback(code, userId) {
  const { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI } = process.env;

  const shortLivedResponse = await axios.get(SHORT_TOKEN_URL, {
    params: {
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      redirect_uri: META_REDIRECT_URI,
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
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
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
    await channelService.createChannel({
      userId,
      platform: 'facebook',
      accountId: page.id,
      accountName: page.name,
      accessToken: page.access_token,
      tokenExpiresAt,
      platformData: { isSimulated: false }
    });
    channelsAdded += 1;

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
  }

  return { channelsAdded };
}

module.exports = {
  getOAuthUrl,
  handleCallback
};
