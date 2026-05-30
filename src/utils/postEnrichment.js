const { prisma } = require('../lib/prisma');

async function enrichPostsForViewer(viewerId, posts) {
  if (!posts.length) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.user_id ?? p.user?.id).filter(Boolean))];

  const [likes, follows] = await Promise.all([
    prisma.like.findMany({
      where: { user_id: viewerId, post_id: { in: postIds } },
      select: { post_id: true },
    }),
    prisma.follow.findMany({
      where: { follower_id: viewerId, following_id: { in: authorIds } },
      select: { following_id: true },
    }),
  ]);

  const likedSet = new Set(likes.map((l) => l.post_id));
  const followSet = new Set(follows.map((f) => f.following_id));

  return posts.map((post) => {
    const authorId = post.user_id ?? post.user?.id;
    return {
      id: post.id,
      content: post.content,
      image_path: post.image_path,
      created_at: post.created_at,
      author: post.user,
      hashtags: post.hashtags?.map((ph) => ph.hashtag?.name ?? ph) ?? [],
      like_count: post._count?.likes ?? post.like_count ?? 0,
      comment_count: post._count?.comments ?? post.comment_count ?? 0,
      liked_by_me: likedSet.has(post.id),
      is_following_author: followSet.has(authorId),
      is_own_post: authorId === viewerId,
    };
  });
}

module.exports = { enrichPostsForViewer };
