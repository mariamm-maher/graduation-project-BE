const axios = require('axios');
const channelService = require('./channelService');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

function getOAuthUrl(userId) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state: String(userId),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function handleCallback(code, userId) {
  const tokenBody = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const tokenRes = await axios.post(GOOGLE_TOKEN_URL, tokenBody.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const { access_token, refresh_token, expires_in } = tokenRes.data || {};
  const tokenExpiresAt = new Date(Date.now() + Number(expires_in || 0) * 1000);

  if (!access_token) {
    throw new Error('YouTube token exchange failed');
  }

  const channelsRes = await axios.get(`${YOUTUBE_API_URL}/channels`, {
    params: { part: 'snippet,statistics', mine: true },
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const item = channelsRes.data?.items?.[0];
  if (!item) {
    throw new Error('No YouTube channel found for this account');
  }

  const channelId = item.id;
  const title = item.snippet.title;
  const description = item.snippet.description;
  const thumbnail = item.snippet.thumbnails?.default?.url;
  const subscriberCount = item.statistics.subscriberCount;
  const videoCount = item.statistics.videoCount;
  const viewCount = item.statistics.viewCount;

  return channelService.createChannel({
    userId,
    platform: 'youtube',
    accountId: channelId,
    accountName: title,
    accountUsername: title,
    profilePicture: thumbnail,
    accessToken: access_token,
    refreshToken: refresh_token,
    tokenExpiresAt,
    platformData: {
      isSimulated: false,
      canPost: false,
      description,
      subscriberCount: Number(subscriberCount),
      videoCount: Number(videoCount),
      viewCount: Number(viewCount),
    },
  });
}

async function refreshYouTubeToken(channel) {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: channel.refreshToken,
    grant_type: 'refresh_token',
  });

  const tokenRes = await axios.post(GOOGLE_TOKEN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const { access_token, expires_in } = tokenRes.data || {};
  return {
    access_token,
    refresh_token: channel.refreshToken,
    expires_in,
  };
}

async function getChannelStats(channel) {
  const res = await axios.get(`${YOUTUBE_API_URL}/channels`, {
    params: { part: 'statistics', id: channel.accountId },
    headers: { Authorization: `Bearer ${channel.accessToken}` },
  });

  const item = res.data?.items?.[0];
  if (!item?.statistics) {
    throw new Error('No YouTube channel statistics returned');
  }

  return {
    subscriberCount: Number(item.statistics.subscriberCount),
    videoCount: Number(item.statistics.videoCount),
    viewCount: Number(item.statistics.viewCount),
  };
}

module.exports = {
  getOAuthUrl,
  handleCallback,
  refreshYouTubeToken,
  getChannelStats,
};
