const { prisma } = require('../lib/prisma');
const { httpError } = require('../middleware/errorHandler');

async function follow(followerId, targetId) {
  if (followerId === targetId) {
    throw httpError(400, 'Cannot follow yourself');
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    throw httpError(404, 'User not found');
  }

  await prisma.follow.upsert({
    where: {
      follower_id_following_id: { follower_id: followerId, following_id: targetId },
    },
    create: { follower_id: followerId, following_id: targetId },
    update: {},
  });

  await prisma.notification.create({
    data: {
      user_id: targetId,
      actor_id: followerId,
      type: 'new_follower',
    },
  });

  return { message: 'Followed successfully' };
}

async function unfollow(followerId, targetId) {
  await prisma.follow.deleteMany({
    where: { follower_id: followerId, following_id: targetId },
  });
  return { message: 'Unfollowed successfully' };
}

module.exports = { follow, unfollow };
