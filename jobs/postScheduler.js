// const cron = require('node-cron');
// const { Op } = require('sequelize');
// const { ScheduledPost, Channel, sequelize } = require('../models');
// const { publishToChannel } = require('./publishHelper');
// const notificationService = require('../services/notificationService');

// async function handler() {
//   const pendingPostChannels = await PostChannel.findAll({
//     where: { status: 'pending' },
//     include: [
//       {
//         model: ScheduledPost,
//         as: 'post',
//         where: {
//           status: 'scheduled',
//           scheduledAt: { [Op.lte]: new Date() }
//         },
//         required: true
//       },
//       {
//         model: Channel,
//         as: 'channel',
//         required: true
//       }
//     ]
//   });

//   for (const postChannel of pendingPostChannels) {
//     const { channel, post } = postChannel;
//     const isSimulated = channel.platformData?.isSimulated === true;

//     try {
//       const { platformPostId } = await publishToChannel({
//         platform: channel.platform,
//         accountId: channel.accountId,
//         accessToken: channel.accessToken,
//         isSimulated,
//         content: post.content,
//         mediaUrls: post.mediaUrls
//       });

//       await postChannel.update({
//         status: 'published',
//         platformPostId,
//         publishedAt: new Date()
//       });
//     } catch (err) {
//       await postChannel.update({
//         status: 'failed',
//         errorMessage: err.message
//       });
//       console.error('[PUBLISH ERROR]', channel.platform, err.message);
//     }

//     const allChannels = await PostChannel.findAll({
//       where: { scheduledPostId: post.id }
//     });

//     const allDone = allChannels.every((pc) => pc.status !== 'pending');
//     const anyFailed = allChannels.some((pc) => pc.status === 'failed');
//     const allPublished = allChannels.every((pc) => pc.status === 'published');

//     if (allPublished) {
//       await post.update({ status: 'published', publishedAt: new Date() });
//       await notificationService.create({
//         userId: post.userId,
//         title: 'Post published',
//         message: 'Your post was published successfully on all channels',
//         type: 'post'
//       });
//     }

//     if (allDone && anyFailed) {
//       await post.update({ status: 'failed' });
//       await notificationService.create({
//         userId: post.userId,
//         title: 'Post failed',
//         message: 'One or more channels failed to publish your post',
//         type: 'post'
//       });
//     }
//   }
// }

// function startScheduler() {
//   cron.schedule('* * * * *', handler);
// }

// module.exports = { startScheduler };
