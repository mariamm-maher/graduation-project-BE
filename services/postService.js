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

async function createPost({
  userId,
  channelIds,
  content,
  mediaUrls,
  scheduledAt,
  contentType,
  options,
  campaignId,
  contentCalendarId,
  collaborationTaskId
}) {
  if (!content || !String(content).trim()) {
    throwBadRequest('Content must not be empty');
  }

  if (!Array.isArray(channelIds) || channelIds.length === 0) {
    throwBadRequest('channelIds must be a non-empty array');
  }

  const scheduledDate = new Date(scheduledAt);
  if (!scheduledAt || Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    throwBadRequest('scheduledAt must be in the future');
  }

  const owned = await Channel.findAll({
    where: {
      id: channelIds,
      userId
    }
  });
  if (owned.length !== channelIds.length) {
    throwBadRequest('One or more channels not found');
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
        content,
        mediaUrls,
        scheduledAt: scheduledDate,
        contentType,
        options,
        status: 'scheduled',
        campaignId: campaignId || null,
        contentCalendarId: contentCalendarId || null,
        collaborationTaskId: collaborationTaskId || null
      },
      { transaction: t }
    );

    for (const channelId of channelIds) {
      await PostChannel.create(
        {
          scheduledPostId: createdPost.id,
          channelId,
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
