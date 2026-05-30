const { prisma } = require('../lib/prisma');
const { isCategoryTag } = require('../utils/hashtags');

const TAG_TO_INTEREST = {
  technology: 'Technology',
  sports: 'Sports',
  music: 'Music',
  art: 'Art',
  science: 'Science',
  travel: 'Travel',
  food: 'Food',
  gaming: 'Gaming',
};

const MAX_INTERESTS = 8;

/**
 * Begeni / yorum sonrasi gonderi hashtag'lerinden ilgi alani ekler.
 */
async function learnInterestsFromPost(userId, post) {
  if (!post?.hashtags?.length) return { added: [] };

  const existing = await prisma.userInterest.findMany({
    where: { user_id: userId },
    include: { interest: true },
  });
  const existingNames = new Set(existing.map((ui) => ui.interest.name));
  if (existing.length >= MAX_INTERESTS) return { added: [] };

  const added = [];
  for (const ph of post.hashtags) {
    const tag = ph.hashtag?.name?.toLowerCase();
    if (!tag || !isCategoryTag(tag)) continue;

    const interestName = TAG_TO_INTEREST[tag];
    if (!interestName || existingNames.has(interestName)) continue;

    const interest = await prisma.interest.findUnique({ where: { name: interestName } });
    if (!interest) continue;

    await prisma.userInterest.create({
      data: { user_id: userId, interest_id: interest.id },
    });
    existingNames.add(interestName);
    added.push(interestName);
    if (existingNames.size >= MAX_INTERESTS) break;
  }

  return { added };
}

module.exports = {
  TAG_TO_INTEREST,
  learnInterestsFromPost,
  MAX_INTERESTS,
};
