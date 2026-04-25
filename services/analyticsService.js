const axios = require('axios');
const cron = require('node-cron');
const { Op, fn, col, literal } = require('sequelize');
const {
  PostAnalytics,
  PostChannel,
  ScheduledPost,
  Channel,
  Campaign,
  sequelize
} = require('../models/index');

function mapInsightValue(insights = [], key, defaultValue = 0) {
  const metric = insights.find((item) => item.name === key);
  if (!metric || !metric.values || !metric.values[0]) return defaultValue;
  const value = metric.values[0].value;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }
  return Number(value) || defaultValue;
}

async function syncAnalytics() {
  const posts = await ScheduledPost.findAll({
    where: { status: 'published' },
    include: [
      {
        model: PostChannel,
        as: 'postChannels',
        include: [{ model: Channel, as: 'channel' }]
      },
      { model: PostAnalytics, as: 'postAnalytics' }
    ]
  });

  for (const post of posts) {
    for (const postChannel of post.postChannels || []) {
      const channel = postChannel.channel;
      if (!channel) continue;

      const isSimulated = channel.platformData?.isSimulated === true;
      let analyticsData;

      if (isSimulated) {
        const prev = post.postAnalytics;
        const prevReach = Number(prev?.reach) || 0;
        const base = prev
          ? Math.floor(prevReach * 1.03)
          : Math.floor(Math.random() * 5000 + 500);

        analyticsData = {
          likes: Math.floor(base * 0.08),
          comments: Math.floor(base * 0.02),
          shares: Math.floor(base * 0.01),
          reach: base,
          impressions: Math.floor(base * 1.3),
          note: 'simulated'
        };
      } else if (channel.platform === 'facebook') {
        const response = await axios.get(
          `https://graph.facebook.com/v19.0/${postChannel.platformPostId}/insights`,
          {
            params: {
              metric: 'post_impressions,post_engaged_users,post_reactions_by_type_total',
              access_token: channel.accessToken
            }
          }
        );

        const insights = response.data?.data || [];
        const impressions = mapInsightValue(insights, 'post_impressions');
        const engagedUsers = mapInsightValue(insights, 'post_engaged_users');
        const reactions = mapInsightValue(insights, 'post_reactions_by_type_total');

        analyticsData = {
          likes: reactions,
          comments: 0,
          shares: 0,
          reach: engagedUsers,
          impressions,
          note: null
        };
      } else if (channel.platform === 'instagram') {
        const response = await axios.get(
          `https://graph.facebook.com/v19.0/${postChannel.platformPostId}/insights`,
          {
            params: {
              metric: 'impressions,reach,likes,comments,shares',
              access_token: channel.accessToken
            }
          }
        );

        const insights = response.data?.data || [];
        analyticsData = {
          likes: mapInsightValue(insights, 'likes'),
          comments: mapInsightValue(insights, 'comments'),
          shares: mapInsightValue(insights, 'shares'),
          reach: mapInsightValue(insights, 'reach'),
          impressions: mapInsightValue(insights, 'impressions'),
          note: null
        };
      } else {
        continue;
      }

      await PostAnalytics.upsert({
        scheduledPostId: post.id,
        ...analyticsData,
        fetchedAt: new Date()
      });
    }
  }
}

async function getPostAnalytics(postId, userId) {
  const post = await ScheduledPost.findOne({
    where: { id: postId, userId },
    include: [
      { model: PostAnalytics, as: 'postAnalytics' },
      {
        model: PostChannel,
        as: 'postChannels',
        include: [
          {
            model: Channel,
            as: 'channel',
            attributes: ['id', 'platform', 'accountName', 'platformData']
          }
        ]
      }
    ]
  });

  if (!post) {
    throw { status: 404, message: 'Post not found' };
  }

  const data = post.toJSON();
  data.analytics = data.postAnalytics || null;
  delete data.postAnalytics;
  return data;
}

async function getChannelAnalytics(channelId, userId) {
  const channel = await Channel.findOne({ where: { id: channelId, userId } });
  if (!channel) {
    throw { status: 404, message: 'Channel not found' };
  }

  const rows = await PostChannel.findAll({
    where: { channelId },
    attributes: [
      [fn('SUM', col('post.postAnalytics.likes')), 'likes'],
      [fn('SUM', col('post.postAnalytics.comments')), 'comments'],
      [fn('SUM', col('post.postAnalytics.shares')), 'shares'],
      [fn('SUM', col('post.postAnalytics.reach')), 'reach'],
      [fn('SUM', col('post.postAnalytics.impressions')), 'impressions'],
      [fn('COUNT', literal('DISTINCT "PostChannel"."scheduledPostId"')), 'postsCount']
    ],
    include: [
      {
        model: ScheduledPost,
        as: 'post',
        attributes: [],
        required: true,
        where: { userId },
        include: [{ model: PostAnalytics, as: 'postAnalytics', attributes: [], required: false }]
      }
    ],
    raw: true
  });

  const agg = rows[0] || {};
  return {
    channelId: Number(channelId),
    likes: Number(agg.likes) || 0,
    comments: Number(agg.comments) || 0,
    shares: Number(agg.shares) || 0,
    reach: Number(agg.reach) || 0,
    impressions: Number(agg.impressions) || 0,
    postsCount: Number(agg.postsCount) || 0
  };
}

async function getCampaignAnalytics(campaignId, userId) {
  const campaign = await Campaign.findOne({ where: { id: campaignId, userId } });
  if (!campaign) {
    throw { status: 404, message: 'Campaign not found' };
  }

  const rows = await PostChannel.findAll({
    attributes: [
      [col('channel.platform'), 'platform'],
      [fn('SUM', col('post.postAnalytics.likes')), 'likes'],
      [fn('SUM', col('post.postAnalytics.comments')), 'comments'],
      [fn('SUM', col('post.postAnalytics.shares')), 'shares'],
      [fn('SUM', col('post.postAnalytics.reach')), 'reach'],
      [fn('SUM', col('post.postAnalytics.impressions')), 'impressions'],
      [fn('COUNT', literal('DISTINCT "PostChannel"."scheduledPostId"')), 'postsCount']
    ],
    include: [
      { model: Channel, as: 'channel', attributes: [], required: true },
      {
        model: ScheduledPost,
        as: 'post',
        attributes: [],
        required: true,
        where: { campaignId, userId },
        include: [{ model: PostAnalytics, as: 'postAnalytics', attributes: [], required: false }]
      }
    ],
    group: ['channel.platform'],
    raw: true
  });

  const byPlatform = rows.map((row) => ({
    platform: row.platform,
    likes: Number(row.likes) || 0,
    comments: Number(row.comments) || 0,
    shares: Number(row.shares) || 0,
    reach: Number(row.reach) || 0,
    impressions: Number(row.impressions) || 0,
    postsCount: Number(row.postsCount) || 0
  }));

  const totals = byPlatform.reduce(
    (acc, row) => {
      acc.likes += row.likes;
      acc.comments += row.comments;
      acc.shares += row.shares;
      acc.reach += row.reach;
      acc.impressions += row.impressions;
      acc.postsCount += row.postsCount;
      return acc;
    },
    { likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0, postsCount: 0 }
  );

  return { campaignId: Number(campaignId), byPlatform, totals };
}

cron.schedule('0 */6 * * *', syncAnalytics);

module.exports = {
  syncAnalytics,
  getPostAnalytics,
  getChannelAnalytics,
  getCampaignAnalytics
};
