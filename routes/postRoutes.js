const express = require('express');
const postService = require('../services/postService');
const { authenticate: authMiddleware } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const post = await postService.createPost({
      userId: req.user.id,
      ...req.body
    });

    await notificationService.create({
      userId: req.user.id,
      title: 'Post scheduled',
      message: `Post scheduled for ${post.scheduledAt}`,
      type: 'post'
    });

    return res.status(201).json({ success: true, data: post });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const posts = await postService.getPostsByUser(req.user.id, req.query);
    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id, req.user.id);
    return res.json({ success: true, data: post });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await postService.deletePost(req.params.id, req.user.id);
    return res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }
});

module.exports = router;
