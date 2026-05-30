const fs = require('fs/promises');
const path = require('path');
const { prisma } = require('../lib/prisma');
const { httpError } = require('../middleware/errorHandler');
const { extractHashtags } = require('../utils/hashtags');
const { learnInterestsFromPost } = require('./interestLearning.service');

async function loadPostWithHashtags(postId) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: { hashtags: { include: { hashtag: true } } },
  });
}

async function upsertHashtags(names) {
  const ids = [];
  for (const name of names) {
    const tag = await prisma.hashtag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    ids.push(tag.id);
  }
  return ids;
}

async function createPost(userId, content, imagePath) {
  if (!content || !content.trim()) {
    throw httpError(400, 'Post content cannot be empty');
  }
  if (content.length > 500) {
    throw httpError(400, 'Post content exceeds 500 characters');
  }

  const hashtagNames = extractHashtags(content);
  const hashtagIds = await upsertHashtags(hashtagNames);

  const post = await prisma.post.create({
    data: {
      user_id: userId,
      content: content.trim(),
      image_path: imagePath || null,
      hashtags: {
        create: hashtagIds.map((hashtag_id) => ({ hashtag_id })),
      },
    },
    include: {
      user: { select: { id: true, username: true } },
      hashtags: { include: { hashtag: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return formatPost(post);
}

async function deletePost(userId, postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw httpError(404, 'Post not found');
  }
  if (post.user_id !== userId) {
    throw httpError(403, 'Forbidden');
  }

  if (post.image_path) {
    try {
      await fs.unlink(path.join(process.cwd(), post.image_path));
    } catch {
      /* ignore missing file */
    }
  }

  await prisma.post.delete({ where: { id: postId } });
  return { message: 'Post deleted' };
}

async function likePost(userId, postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw httpError(404, 'Post not found');
  }

  try {
    await prisma.like.create({ data: { user_id: userId, post_id: postId } });
    if (post.user_id !== userId) {
      await prisma.notification.create({
        data: {
          user_id: post.user_id,
          actor_id: userId,
          type: 'post_liked',
          post_id: postId,
        },
      });
    }
    const fullPost = await loadPostWithHashtags(postId);
    await learnInterestsFromPost(userId, fullPost);
    return { message: 'Post liked' };
  } catch (err) {
    if (err.code === 'P2002') {
      throw httpError(409, 'Already liked');
    }
    throw err;
  }
}

async function unlikePost(userId, postId) {
  await prisma.like.deleteMany({ where: { user_id: userId, post_id: postId } });
  return { message: 'Post unliked' };
}

async function addComment(userId, postId, content, parentCommentId = null) {
  if (!content || !content.trim()) {
    throw httpError(400, 'Comment cannot be empty');
  }
  if (content.length > 300) {
    throw httpError(400, 'Comment exceeds 300 characters');
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw httpError(404, 'Post not found');
  }

  let parentComment = null;
  if (parentCommentId != null) {
    parentComment = await prisma.comment.findUnique({ where: { id: parentCommentId } });
    if (!parentComment || parentComment.post_id !== postId) {
      throw httpError(404, 'Parent comment not found');
    }
  }

  const comment = await prisma.comment.create({
    data: {
      user_id: userId,
      post_id: postId,
      content: content.trim(),
      ...(parentCommentId != null ? { parent_id: parentCommentId } : {}),
    },
    include: { user: { select: { id: true, username: true } } },
  });

  if (parentComment && parentComment.user_id !== userId) {
    await prisma.notification.create({
      data: {
        user_id: parentComment.user_id,
        actor_id: userId,
        type: 'comment_replied',
        post_id: postId,
      },
    });
  } else if (!parentComment && post.user_id !== userId) {
    await prisma.notification.create({
      data: {
        user_id: post.user_id,
        actor_id: userId,
        type: 'post_commented',
        post_id: postId,
      },
    });
  }

  const fullPost = await loadPostWithHashtags(postId);
  await learnInterestsFromPost(userId, fullPost);

  return {
    id: comment.id,
    content: comment.content,
    created_at: comment.created_at,
    parent_id: comment.parent_id,
    user: comment.user,
  };
}

async function getPostById(postId, viewerId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: { select: { id: true, username: true } },
      hashtags: { include: { hashtag: true } },
      comments: {
        orderBy: { created_at: 'asc' },
        include: { user: { select: { id: true, username: true } } },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post) {
    throw httpError(404, 'Post not found');
  }

  let liked_by_me = false;
  if (viewerId) {
    const like = await prisma.like.findUnique({
      where: { user_id_post_id: { user_id: viewerId, post_id: postId } },
    });
    liked_by_me = Boolean(like);
  }

  return {
    ...formatPost(post),
    author_id: post.user_id,
    liked_by_me,
    comments: post.comments.map((c) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      parent_id: c.parent_id,
      user: c.user,
    })),
  };
}

async function getUserPosts(userId, viewerId) {
  const posts = await prisma.post.findMany({
    where: { user_id: userId },
    include: {
      user: { select: { id: true, username: true } },
      hashtags: { include: { hashtag: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  if (viewerId) {
    const { enrichPostsForViewer } = require('../utils/postEnrichment');
    return enrichPostsForViewer(viewerId, posts);
  }

  return posts.map(formatPost);
}

async function deleteComment(userId, commentId) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw httpError(404, 'Comment not found');
  }
  if (comment.user_id !== userId) {
    throw httpError(403, 'Forbidden');
  }
  await prisma.comment.delete({ where: { id: commentId } });
  return { message: 'Comment deleted' };
}

function formatPost(post) {
  return {
    id: post.id,
    content: post.content,
    image_path: post.image_path,
    created_at: post.created_at,
    author: post.user,
    hashtags: post.hashtags?.map((ph) => ph.hashtag.name) ?? [],
    like_count: post._count?.likes ?? 0,
    comment_count: post._count?.comments ?? 0,
  };
}

module.exports = {
  createPost,
  getPostById,
  getUserPosts,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
};
