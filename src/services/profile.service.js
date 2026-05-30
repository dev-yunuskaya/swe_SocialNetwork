const { prisma } = require('../lib/prisma');
const { httpError } = require('../middleware/errorHandler');

async function getProfile(identifier, viewerId) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: Number.isInteger(Number(identifier)) ? Number(identifier) : -1 },
        { username: String(identifier) },
      ],
    },
    include: {
      interests: { include: { interest: true } },
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    throw httpError(404, 'User not found');
  }

  let is_following = false;
  if (viewerId && viewerId !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        follower_id_following_id: { follower_id: viewerId, following_id: user.id },
      },
    });
    is_following = Boolean(follow);
  }

  return {
    id: user.id,
    username: user.username,
    email: viewerId === user.id ? user.email : undefined,
    display_name: user.display_name,
    bio: user.bio,
    interests: user.interests.map((ui) => ui.interest.name),
    post_count: user._count.posts,
    follower_count: user._count.followers,
    following_count: user._count.following,
    created_at: user.created_at,
    is_self: viewerId === user.id,
    is_following,
  };
}

async function updateProfile(userId, { display_name, bio, interests }) {
  const data = {};
  if (display_name !== undefined) data.display_name = display_name;
  if (bio !== undefined) data.bio = bio;

  if (interests !== undefined) {
    if (!Array.isArray(interests) || interests.length === 0) {
      throw httpError(400, 'At least one interest must be selected');
    }
    const interestRecords = await prisma.interest.findMany({
      where: { name: { in: interests } },
    });
    if (interestRecords.length !== interests.length) {
      throw httpError(400, 'Invalid interest selection');
    }
    await prisma.userInterest.deleteMany({ where: { user_id: userId } });
    await prisma.userInterest.createMany({
      data: interestRecords.map((i) => ({ user_id: userId, interest_id: i.id })),
    });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: { interests: { include: { interest: true } } },
  });

  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    bio: user.bio,
    interests: user.interests.map((ui) => ui.interest.name),
  };
}

module.exports = { getProfile, updateProfile };
