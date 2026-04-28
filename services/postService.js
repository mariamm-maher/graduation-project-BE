const axios = require('axios');
const { Op } = require('sequelize');
const ScheduledPost = require('../models/ScheduledPost');
const Channel = require('../models/channel');

const GRAPH_BASE_URL = 'https://graph.facebook.com/v19.0';

function badRequest(message) {
  throw { status: 400, message };
}

function toNumberList(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0)
  )];
}

async function publishToFacebook({ channel, content, mediaUrls }) {
  const hasImage = Array.isArray(mediaUrls) && mediaUrls.length > 0 && !!mediaUrls[0];
  const endpoint = hasImage ? `${GRAPH_BASE_URL}/${channel.accountId}/photos` : `${GRAPH_BASE_URL}/${channel.accountId}/feed`;
  const payload = hasImage
    ? { url: mediaUrls[0], caption: content, access_token: channel.accessToken }
    : { message: content, access_token: channel.accessToken };

  const res = await axios.post(endpoint, payload);
  return res.data?.post_id || res.data?.id || null;
}

async function createPosts({
  userId,
  content,
  channelIds,
  platforms = [],
  mediaUrls = [],
  publishNow = false,
  scheduledAt = null
}) {
  if (!content || !String(content).trim()) badRequest('content is required');

  const normalizedChannelIds = toNumberList(channelIds);
  if (normalizedChannelIds.length === 0) badRequest('channelIds must be a non-empty array');

  const channels = await Channel.findAll({
    where: {
      id: normalizedChannelIds,
      userId
    }
  });

  if (channels.length !== normalizedChannelIds.length) {
    badRequest('One or more channels not found');
  }

  const normalizedPlatforms = (Array.isArray(platforms) ? platforms : [])
    .map((p) => String(p).toLowerCase());

  const selectedChannels = channels.filter((ch) => {
    if (normalizedPlatforms.length === 0) return true;
    return normalizedPlatforms.includes(ch.platform.toLowerCase());
  });

  const posts = [];
  for (const channel of selectedChannels) {
    if (channel.platform.toLowerCase() !== 'facebook') {
      continue;
    }

    if (!publishNow) {
      if (!scheduledAt) badRequest('scheduledAt is required when publishNow is false');
      const scheduledDate = new Date(scheduledAt);
      if (Number.isNaN(scheduledDate.getTime())) badRequest('scheduledAt must be a valid ISO date');

      const post = await ScheduledPost.create({
        channelId: channel.id,
        content,
        mediaUrls,
        scheduledAt: scheduledDate,
        status: 'scheduled'
      });

      posts.push({
        id: post.id,
        userId,
        channelId: channel.id,
        platform: channel.platform,
        content: post.content,
        mediaUrls: post.mediaUrls,
        status: post.status,
        scheduledAt: post.scheduledAt,
        fbPostId: null,
        createdAt: post.createdAt
      });
      continue;
    }

    try {
      const fbPostId = await publishToFacebook({ channel, content, mediaUrls });
      const post = await ScheduledPost.create({
        channelId: channel.id,
        content,
        mediaUrls,
        scheduledAt: new Date(),
        status: 'published',
        platformPostId: fbPostId,
        publishedAt: new Date()
      });

      posts.push({
        id: post.id,
        userId,
        channelId: channel.id,
        platform: channel.platform,
        content: post.content,
        mediaUrls: post.mediaUrls,
        status: post.status,
        scheduledAt: post.scheduledAt,
        fbPostId: post.platformPostId,
        createdAt: post.createdAt
      });
    } catch (error) {
      const post = await ScheduledPost.create({
        channelId: channel.id,
        content,
        mediaUrls,
        scheduledAt: new Date(),
        status: 'failed',
        errorMessage: error.response?.data?.error?.message || error.message
      });

      posts.push({
        id: post.id,
        userId,
        channelId: channel.id,
        platform: channel.platform,
        content: post.content,
        mediaUrls: post.mediaUrls,
        status: post.status,
        scheduledAt: post.scheduledAt,
        fbPostId: null,
        createdAt: post.createdAt
      });
    }
  }

  return { posts };
}

async function getPostsByUser(userId) {
  const posts = await ScheduledPost.findAll({
    include: [
      {
        model: Channel,
        as: 'Channel',
        where: { userId },
        attributes: ['id', 'platform', 'accountName', 'accountUsername', 'userId']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return {
    posts: posts.map((post) => ({
      id: post.id,
      userId: post.Channel.userId,
      channelId: post.channelId,
      platform: post.Channel.platform,
      content: post.content,
      mediaUrls: post.mediaUrls,
      status: post.status,
      scheduledAt: post.scheduledAt,
      fbPostId: post.platformPostId || null,
      createdAt: post.createdAt
    }))
  };
}

async function deletePost(postId, userId) {
  const post = await ScheduledPost.findOne({
    where: { id: postId },
    include: [{ model: Channel, as: 'Channel', where: { userId } }]
  });

  if (!post) throw { status: 404, message: 'Post not found' };

  if (post.status === 'published' && post.platformPostId) {
    try {
      await axios.delete(`${GRAPH_BASE_URL}/${post.platformPostId}`, {
        params: { access_token: post.Channel.accessToken }
      });
    } catch (error) {
      throw {
        status: 400,
        message: error.response?.data?.error?.message || 'Failed to delete post from Facebook'
      };
    }
  }

  await post.destroy();
  return { success: true };
}

async function getPostAnalytics(postId, userId) {
  const post = await ScheduledPost.findOne({
    where: { id: postId },
    include: [{ model: Channel, as: 'Channel', where: { userId } }]
  });

  if (!post) throw { status: 404, message: 'Post not found' };
  if (!post.platformPostId) {
    throw {
      status: 400,
      message: 'Post has no Facebook post ID yet (it may be scheduled or failed)'
    };
  }

  try {
    const postResponse = await axios.get(`${GRAPH_BASE_URL}/${post.platformPostId}`, {
      params: {
        fields: 'likes.summary(true),comments.summary(true)',
        access_token: post.Channel.accessToken
      }
    });

    let reach = 0;
    try {
      const insightsResponse = await axios.get(`${GRAPH_BASE_URL}/${post.platformPostId}/insights`, {
        params: {
          metric: 'post_impressions',
          access_token: post.Channel.accessToken
        }
      });
      reach = insightsResponse.data?.data?.[0]?.values?.[0]?.value || 0;
    } catch (insightsErr) {
      // Some posts/tokens don't allow insights; keep likes/comments response usable.
      reach = 0;
    }

    const likes = postResponse.data?.likes?.summary?.total_count || 0;
    const comments = postResponse.data?.comments?.summary?.total_count || 0;

    return { likes, comments, reach };
  } catch (error) {
    const fbMessage = error.response?.data?.error?.message;
    const fallbackMessage = error.message || 'Failed to fetch Facebook post analytics';
    throw {
      status: error.response?.status || 400,
      message: fbMessage || fallbackMessage
    };
  }
}

async function getDueScheduledPosts() {
  return ScheduledPost.findAll({
    where: {
      status: 'scheduled',
      scheduledAt: { [Op.lte]: new Date() }
    },
    include: [{ model: Channel, as: 'Channel' }]
  });
}

async function markPostPublished(postId, fbPostId) {
  await ScheduledPost.update(
    { status: 'published', platformPostId: fbPostId, publishedAt: new Date(), errorMessage: null },
    { where: { id: postId } }
  );
}

async function markPostFailed(postId, message) {
  await ScheduledPost.update(
    { status: 'failed', errorMessage: message },
    { where: { id: postId } }
  );
}

module.exports = {
  createPosts,
  getPostsByUser,
  deletePost,
  getPostAnalytics,
  getDueScheduledPosts,
  markPostPublished,
  markPostFailed,
  publishToFacebook
};
