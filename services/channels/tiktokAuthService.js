const axios = require('axios');
const channelService = require('./channelService');

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_USER_URL = 'https://open.tiktokapis.com/v2/user/info/';

async function getOAuthUrl(userId) {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    response_type: 'code',
    scope: 'user.info.profile,user.info.stats',
    state: String(userId)
  });

  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

async function handleCallback(code, userId) {
  const tokenBody = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.TIKTOK_REDIRECT_URI
  });

  const tokenResponse = await axios.post(TIKTOK_TOKEN_URL, tokenBody.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const tokenPayload = tokenResponse.data?.data || tokenResponse.data || {};
  const accessToken = tokenPayload.access_token;
  const refreshToken = tokenPayload.refresh_token;
  const expiresIn = Number(tokenPayload.expires_in || 0);
  const openId = tokenPayload.open_id;

  if (!accessToken) {
    throw new Error('TikTok token exchange failed');
  }

  const userResponse = await axios.get(TIKTOK_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      fields:
        'open_id,username,display_name,avatar_url,bio_description,follower_count,following_count,likes_count'
    }
  });

  const user = userResponse.data?.data?.user || userResponse.data?.user || {};

  return channelService.createChannel({
    userId,
    platform: 'tiktok',
    accountId: user.open_id || openId,
    accountName: user.display_name,
    accountUsername: user.username,
    profilePicture: user.avatar_url,
    accessToken,
    refreshToken,
    tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    platformData: {
      isSimulated: false,
      canPost: false,
      bio: user.bio_description,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      likesCount: user.likes_count
    }
  });
}

async function refreshTikTokToken(channel) {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: channel.refreshToken
  });

  const response = await axios.post(TIKTOK_TOKEN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const payload = response.data?.data || response.data || {};
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: payload.expires_in
  };
}

module.exports = { getOAuthUrl, handleCallback, refreshTikTokToken };
