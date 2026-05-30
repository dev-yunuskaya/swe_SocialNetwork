const { prisma } = require('../lib/prisma');
const { enrichPostsForViewer } = require('../utils/postEnrichment');

async function getFeed(userId, options = {}) {
  const { cursor, limit = 12, excludeIds = [] } = options;

  const following = await prisma.follow.findMany({
    where: { follower_id: userId },
    select: { following_id: true },
  });

  const followingIds = following.map((f) => f.following_id);
  if (followingIds.length === 0) {
    return { posts: [], next_cursor: null };
  }

  const where = {
    user_id: { in: followingIds },
    ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    ...(cursor ? { created_at: { lt: new Date(cursor) } } : {}),
  };

  const posts = await prisma.post.findMany({
    where,
    include: {
      user: { select: { id: true, username: true } },
      hashtags: { include: { hashtag: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { created_at: 'desc' },
    take: limit + 1,
  });

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  const next_cursor = hasMore ? page[page.length - 1].created_at.toISOString() : null;

  return {
    posts: await enrichPostsForViewer(userId, page),
    next_cursor,
  };
}

module.exports = { getFeed };
