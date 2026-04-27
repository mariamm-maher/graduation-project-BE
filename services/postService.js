const {
  ScheduledPost,
  PostChannel,
  Channel,
  Campaign,
  ContentCalendar,
  CollaborationTask,
  sequelize
} = require('../models/index');
const PostAnalytics = require('../models/PostAnalytics');

function throwBadRequest(message) {
  throw { status: 400, message };
}

function normalizeChannelId(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number' || typeof raw === 'string') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  if (typeof raw === 'object') {
    const candidate = raw.id ?? raw.value ?? raw.channelId ?? raw.channel_id;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

async function createPost({
  userId,
  channelIds,
  channelId,
  channels,
  content,
  caption,
  text,
  mediaUrls,
  media,
  scheduledAt,
  scheduleAt,
  scheduledDate: scheduledDateInput,
  publishAt,
  contentType,
  options,
  campaignId,
  contentCalendarId,
  collaborationTaskId
}) {
  const normalizedContent = content || caption || text;
  if (!normalizedContent || !String(normalizedContent).trim()) {
    throwBadRequest('Content must not be empty');
  }

  const rawChannelIds = (
    Array.isArray(channelIds) ? channelIds :
    Array.isArray(channels) ? channels :
    channelId !== undefined && channelId !== null ? [channelId] :
    []
  );

  const normalizedChannelIds = [...new Set(
    rawChannelIds
      .map((id) => normalizeChannelId(id))
      .filter((id) => id !== null)
  )];

  if (normalizedChannelIds.length === 0) {
    throwBadRequest('channelIds must be a non-empty array of valid channel IDs');
  }

  const normalizedScheduledAt = scheduledAt || scheduleAt || scheduledDateInput || publishAt;
  const scheduledDate = new Date(normalizedScheduledAt);
  if (!normalizedScheduledAt || Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    throwBadRequest('scheduledAt must be in the future');
  }

  const owned = await Channel.findAll({
    where: {
      id: normalizedChannelIds,
      userId
    }
  });
  if (owned.length !== normalizedChannelIds.length) {
    throwBadRequest('One or more channels not found for this user');
  }

  if (collaborationTaskId) {
    const task = await CollaborationTask.findByPk(collaborationTaskId);
    if (!task) {
      throwBadRequest('CollaborationTask not found');
    }
  }

  if (contentCalendarId) {
    const calendar = await ContentCalendar.findByPk(contentCalendarId);
    if (!calendar) {
      throwBadRequest('ContentCalendar not found');
    }
    if (campaignId && Number(calendar.campaignId) !== Number(campaignId)) {
      throwBadRequest('ContentCalendar does not belong to campaign');
    }
  }

  const post = await sequelize.transaction(async (t) => {
    const createdPost = await ScheduledPost.create(
      {
        userId,
        // Current model still requires channelId, so we keep primary channel here
        // and maintain per-channel targets in PostChannel records.
        channelId: normalizedChannelIds[0],
        content: normalizedContent,
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : (Array.isArray(media) ? media : []),
        scheduledAt: scheduledDate,
        contentType: contentType || 'post',
        options: options || {},
        status: 'scheduled',
        campaignId: campaignId || null,
        contentCalendarId: contentCalendarId || null,
        collaborationTaskId: collaborationTaskId || null
      },
      { transaction: t }
    );

    for (const currentChannelId of normalizedChannelIds) {
      await PostChannel.create(
        {
          scheduledPostId: createdPost.id,
          channelId: currentChannelId,
          status: 'pending'
        },
        { transaction: t }
      );
    }

    return ScheduledPost.findByPk(createdPost.id, {
      include: [{ model: PostChannel, as: 'postChannels' }],
      transaction: t
    });
  });

  return post;
}

async function getPostsByUser(userId, filters = {}) {
  const where = { userId };

  if (filters.status) where.status = filters.status;
  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.collaborationTaskId) where.collaborationTaskId = filters.collaborationTaskId;

  return ScheduledPost.findAll({
    where,
    include: [
      {
        model: PostChannel,
        as: 'postChannels',
        include: [
          {
            model: Channel,
            as: 'channel',
            attributes: ['id', 'platform', 'accountName', 'accountUsername']
          }
        ]
      },
      { model: Campaign, as: 'campaign', attributes: ['id', 'campaignName'] },
      { model: ContentCalendar, as: 'contentCalendar', attributes: ['id', 'day', 'platform'] },
      { model: CollaborationTask, as: 'collaborationTask', attributes: ['id', 'taskName'] }
    ],
    order: [['scheduledAt', 'DESC']]
  });
}

async function getPostById(postId, userId) {
  const post = await ScheduledPost.findOne({
    where: { id: postId, userId },
    include: [
      {
        model: PostChannel,
        as: 'postChannels',
        include: [
          { model: Channel, as: 'channel' },
          { model: PostAnalytics, as: 'analytics' }
        ]
      }
    ]
  });

  if (!post) {
    throw { status: 404, message: 'Post not found' };
  }

  return post;
}

async function deletePost(postId, userId) {
  const post = await ScheduledPost.findOne({ where: { id: postId, userId } });
  if (!post) {
    throw { status: 404, message: 'Post not found' };
  }

  if (post.status === 'published') {
    throw { status: 400, message: 'Cannot delete a published post' };
  }

  await post.destroy();
  return { success: true };
}

module.exports = {
  createPost,
  getPostsByUser,
  getPostById,
  deletePost
};
