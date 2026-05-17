const cron = require('node-cron');
const postService = require('../services/postService');

async function handler() {
  const duePosts = await postService.getDueScheduledPosts();

  for (const post of duePosts) {
    try {
      const fbPostId = await postService.publishToFacebook({
        channel: post.channel,
        content: post.content,
        mediaUrls: post.mediaUrls || []
      });

      await postService.markPostPublished(post.id, fbPostId);
    } catch (error) {
      await postService.markPostFailed(
        post.id,
        error.response?.data?.error?.message || error.message
      );
    }
  }
}

function startScheduler() {
  cron.schedule('* * * * *', handler);
}

module.exports = { startScheduler };
