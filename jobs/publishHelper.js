const axios = require('axios');

/*
  Single source of truth for publishing to all platforms.
  Used by both postScheduler and campaignEngine.
*/
async function publishToChannel({
  platform,
  accountId,
  accessToken,
  isSimulated,
  content,
  mediaUrls
}) {
  if (isSimulated === true) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('[SIMULATED] TikTok publish — accountId:', accountId);
    return { platformPostId: `tiktok_sim_post_${Date.now()}` };
  }

  if (platform === 'facebook') {
    const res = await axios.post(
      `https://graph.facebook.com/v19.0/${accountId}/feed`,
      { message: content, access_token: accessToken }
    );
    return { platformPostId: res.data.id };
  }

  if (platform === 'instagram') {
    const container = await axios.post(
      `https://graph.facebook.com/v19.0/${accountId}/media`,
      {
        caption: content,
        image_url: mediaUrls?.[0] || null,
        access_token: accessToken
      }
    );

    const publish = await axios.post(
      `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
      { creation_id: container.data.id, access_token: accessToken }
    );

    return { platformPostId: publish.data.id };
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

module.exports = { publishToChannel };
