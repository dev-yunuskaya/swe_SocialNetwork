const express = require('express');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { optionalAuthenticate } = require('../middleware/optionalAuth');
const { upload, handleUploadError } = require('../middleware/upload');
const postService = require('../services/post.service');

const router = express.Router();

router.post(
  '/posts',
  authenticate,
  upload.single('image'),
  handleUploadError,
  async (req, res, next) => {
    try {
      const imagePath = req.file
        ? path.join(process.env.UPLOAD_DIR || 'uploads', req.file.filename)
        : null;
      const post = await postService.createPost(req.user.id, req.body.content, imagePath);
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/posts/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const post = await postService.getPostById(
      Number(req.params.id),
      req.user?.id
    );
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
});

router.get('/users/:userId/posts', optionalAuthenticate, async (req, res, next) => {
  try {
    const posts = await postService.getUserPosts(
      Number(req.params.userId),
      req.user?.id
    );
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
});

router.delete('/posts/:id', authenticate, async (req, res, next) => {
  try {
    const result = await postService.deletePost(req.user.id, Number(req.params.id));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/posts/:id/like', authenticate, async (req, res, next) => {
  try {
    const result = await postService.likePost(req.user.id, Number(req.params.id));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.delete('/posts/:id/like', authenticate, async (req, res, next) => {
  try {
    const result = await postService.unlikePost(req.user.id, Number(req.params.id));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/posts/:id/comments', authenticate, async (req, res, next) => {
  try {
    const parentId = req.body.parent_comment_id ?? req.body.parent_id;
    const comment = await postService.addComment(
      req.user.id,
      Number(req.params.id),
      req.body.content || req.body.text,
      parentId != null ? Number(parentId) : null
    );
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

router.delete('/comments/:id', authenticate, async (req, res, next) => {
  try {
    const result = await postService.deleteComment(req.user.id, Number(req.params.id));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
