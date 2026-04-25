const cron = require('node-cron');
const { Op } = require('sequelize');
const {
  ContentCalendar,
  CollaborationTask,
  Channel,
  Campaign,
  ScheduledPost,
  PostChannel,
  Collaboration,
  sequelize
} = require('../models/index');
const { publishToChannel } = require('./publishHelper');
const notificationService = require('../services/notificationService');

async function processCalendarEntries() {
  const entries = await ContentCalendar.findAll({
    where: {
      status: 'scheduled',
      date: { [Op.lte]: new Date() }
    },
    include: [
      {
        model: Campaign,
        as: 'campaign',
        attributes: ['id', 'userId']
      }
    ]
  });

  for (const entry of entries) {
    const channel = await Channel.findOne({
      where: {
        userId: entry.campaign.userId,
        platform: entry.platform,
        status: 'active'
      }
    });

    if (!channel) {
      console.warn('[CAMPAIGN ENGINE] No active channel for entry:', entry.id, entry.platform);
      continue;
    }

    let post;
    let postChannel;

    try {
      ({ post, postChannel } = await sequelize.transaction(async (transaction) => {
        const createdPost = await ScheduledPost.create(
          {
            userId: entry.campaign.userId,
            campaignId: entry.campaignId,
            contentCalendarId: entry.id,
            content: entry.caption,
            mediaUrls: entry.mediaUrl ? [entry.mediaUrl] : [],
            contentType: entry.contentType,
            scheduledAt: entry.date,
            status: 'scheduled'
          },
          { transaction }
        );

        const createdPostChannel = await PostChannel.create(
          {
            scheduledPostId: createdPost.id,
            channelId: channel.id,
            status: 'pending'
          },
          { transaction }
        );

        return { post: createdPost, postChannel: createdPostChannel };
      }));

      const { platformPostId } = await publishToChannel({
        platform: channel.platform,
        accountId: channel.accountId,
        accessToken: channel.accessToken,
        isSimulated: channel.platformData?.isSimulated,
        content: entry.caption,
        mediaUrls: entry.mediaUrl ? [entry.mediaUrl] : []
      });

      await postChannel.update({
        status: 'published',
        platformPostId,
        publishedAt: new Date()
      });
      await post.update({ status: 'published', publishedAt: new Date() });
      await ContentCalendar.update({ status: 'posted' }, { where: { id: entry.id } });

      await notificationService.create({
        userId: entry.campaign.userId,
        title: 'Campaign post published',
        message: `Campaign post published on ${entry.platform}`,
        type: 'campaign'
      });
    } catch (err) {
      if (postChannel) {
        await postChannel.update({ status: 'failed', errorMessage: err.message });
      }
      if (post) {
        await post.update({ status: 'failed', errorMessage: err.message });
      }
      await ContentCalendar.update({ status: 'failed' }, { where: { id: entry.id } });
    }
  }
}

async function processCollaborationTasks() {
  const tasks = await CollaborationTask.findAll({
    where: {
      status: 'approved',
      dueDate: { [Op.lte]: new Date() }
    },
    include: [
      {
        model: Collaboration,
        as: 'collaboration',
        attributes: ['id', 'influencerId', 'campaignId', 'ownerId']
      }
    ]
  });

  for (const task of tasks) {
    const channel = await Channel.findOne({
      where: {
        userId: task.collaboration.influencerId,
        platform: task.platform,
        status: 'active'
      }
    });

    if (!channel) {
      console.warn('[CAMPAIGN ENGINE] No active channel for task:', task.id, task.platform);
      continue;
    }

    const content = `${task.taskName}\n\n${task.description || ''}`;
    let post;
    let postChannel;

    try {
      ({ post, postChannel } = await sequelize.transaction(async (transaction) => {
        const createdPost = await ScheduledPost.create(
          {
            userId: task.collaboration.influencerId,
            campaignId: task.collaboration.campaignId,
            collaborationTaskId: task.id,
            content,
            mediaUrls: [],
            contentType: 'post',
            scheduledAt: new Date(),
            status: 'scheduled'
          },
          { transaction }
        );

        const createdPostChannel = await PostChannel.create(
          {
            scheduledPostId: createdPost.id,
            channelId: channel.id,
            status: 'pending'
          },
          { transaction }
        );

        return { post: createdPost, postChannel: createdPostChannel };
      }));

      const { platformPostId } = await publishToChannel({
        platform: channel.platform,
        accountId: channel.accountId,
        accessToken: channel.accessToken,
        isSimulated: channel.platformData?.isSimulated,
        content,
        mediaUrls: []
      });

      await postChannel.update({
        status: 'published',
        platformPostId,
        publishedAt: new Date()
      });
      await post.update({ status: 'published', publishedAt: new Date() });

      await CollaborationTask.update(
        { status: 'in_review', completedAt: new Date() },
        { where: { id: task.id } }
      );

      await notificationService.create({
        userId: task.collaboration.influencerId,
        title: 'Task published',
        message: `Your task "${task.taskName}" was posted on ${task.platform}`,
        type: 'collaboration'
      });

      let ownerUserId = task.collaboration.ownerId;
      if (!ownerUserId && task.collaboration.campaignId) {
        const campaign = await Campaign.findByPk(task.collaboration.campaignId, {
          attributes: ['id', 'userId']
        });
        ownerUserId = campaign?.userId;
      }

      if (ownerUserId) {
        await notificationService.create({
          userId: ownerUserId,
          title: 'Task published',
          message: `Task "${task.taskName}" was posted on ${task.platform}`,
          type: 'collaboration'
        });
      }
    } catch (err) {
      if (postChannel) {
        await postChannel.update({ status: 'failed', errorMessage: err.message });
      }
      if (post) {
        await post.update({ status: 'failed', errorMessage: err.message });
      }

      await notificationService.create({
        userId: task.collaboration.influencerId,
        title: 'Task publish failed',
        message: `Publishing failed for "${task.taskName}" on ${task.platform}`,
        type: 'collaboration'
      });
    }
  }
}

async function handler() {
  await processCalendarEntries();
  await processCollaborationTasks();
}

function startCampaignEngine() {
  cron.schedule('* * * * *', handler);
}

module.exports = { startCampaignEngine };
