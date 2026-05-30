#!/usr/bin/env node
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const {
  DEMO_USERS,
  DEMO_POSTS,
  DEMO_MUTUAL_FOLLOWS,
  INTEREST_AREAS,
} = require('./demo-content');
const { ensurePostImage, ensureDemoImages } = require('./demo-images');

const prisma = new PrismaClient();

async function ensureBaseInterests() {
  for (const name of INTEREST_AREAS) {
    await prisma.interest.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
}

async function getInterestIds(names) {
  const records = await prisma.interest.findMany({ where: { name: { in: names } } });
  return records.map((r) => r.id);
}

async function ensureUser(spec, { resetPassword = false } = {}) {
  const existing =
    (await prisma.user.findUnique({ where: { email: spec.email } })) ||
    (await prisma.user.findUnique({ where: { username: spec.username } }));
  const password_hash = await bcrypt.hash(spec.password, 10);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        email: spec.email,
        username: spec.username,
        bio: spec.bio,
        display_name: spec.display_name,
        ...(resetPassword ? { password_hash } : {}),
      },
    });
    return existing;
  }

  const interestIds = await getInterestIds(spec.interests);
  return prisma.user.create({
    data: {
      username: spec.username,
      email: spec.email,
      password_hash,
      bio: spec.bio,
      display_name: spec.display_name,
      interests: { create: interestIds.map((interest_id) => ({ interest_id })) },
    },
  });
}

async function ensureFollow(followerId, followingId) {
  if (followerId === followingId) return;
  await prisma.follow.upsert({
    where: {
      follower_id_following_id: { follower_id: followerId, following_id: followingId },
    },
    create: { follower_id: followerId, following_id: followingId },
    update: {},
  });
}

async function resetDemoPosts(userIds) {
  await prisma.notification.deleteMany({
    where: { OR: [{ user_id: { in: userIds } }, { actor_id: { in: userIds } }] },
  });
  await prisma.message.deleteMany({
    where: { OR: [{ sender_id: { in: userIds } }, { recipient_id: { in: userIds } }] },
  });
  await prisma.comment.deleteMany({ where: { user_id: { in: userIds } } });
  await prisma.like.deleteMany({ where: { user_id: { in: userIds } } });
  await prisma.post.deleteMany({ where: { user_id: { in: userIds } } });
}

async function resetDemoFollows(userIds) {
  await prisma.follow.deleteMany({
    where: {
      follower_id: { in: userIds },
      following_id: { in: userIds },
    },
  });
}

async function createPost(authorId, spec) {
  const matches = spec.content.match(/#[\w\u00C0-\u024F]+/gi) || [];
  const names = [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
  const hashtagIds = [];
  for (const name of names) {
    const tag = await prisma.hashtag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    hashtagIds.push(tag.id);
  }

  let image_path = null;
  if (spec.imageSeed) {
    const file = await ensurePostImage(spec.imageSeed);
    if (file) image_path = `uploads/demo/${file}`;
  }

  return prisma.post.create({
    data: {
      user_id: authorId,
      content: spec.content,
      image_path,
      hashtags: { create: hashtagIds.map((hashtag_id) => ({ hashtag_id })) },
    },
  });
}

async function seedFollowGraph(users) {
  for (const [follower, following] of DEMO_MUTUAL_FOLLOWS) {
    if (users[follower] && users[following]) {
      await ensureFollow(users[follower].id, users[following].id);
    }
  }
}

async function main() {
  const reset = process.argv.includes('--reset');

  await ensureBaseInterests();
  await ensureDemoImages();

  const users = {};
  for (const spec of DEMO_USERS) {
    users[spec.username] = await ensureUser(spec, { resetPassword: true });
  }

  const userIds = Object.values(users).map((u) => u.id);

  if (reset) {
    await resetDemoPosts(userIds);
    await resetDemoFollows(userIds);
    // eslint-disable-next-line no-console
    console.log('Demo verileri sifirlaniyor...');
  }

  await seedFollowGraph(users);

  let created = 0;
  let images = 0;

  for (const spec of DEMO_POSTS) {
    const author = users[spec.user];
    if (!author) continue;

    const exists = await prisma.post.findFirst({
      where: { user_id: author.id, content: spec.content },
    });
    if (exists) continue;

    if (spec.imageSeed) {
      await ensurePostImage(spec.imageSeed);
    }

    const post = await createPost(author.id, spec);
    created += 1;
    if (post.image_path) images += 1;
  }

  // eslint-disable-next-line no-console
  console.log('\nDemo hazir (tek komut, gorseller dahil):');
  // eslint-disable-next-line no-console
  console.log(`  ${DEMO_USERS.length} kullanici (2 giris + 8 icerik havuzu)`);
  // eslint-disable-next-line no-console
  console.log(`  ${DEMO_POSTS.length} hedef gonderi (${created} yeni, ${images} gorselli)`);
  // eslint-disable-next-line no-console
  console.log('\nGiris hesaplari (sifre: password123):');
  // eslint-disable-next-line no-console
  console.log('  test.ayse@demo.com');
  // eslint-disable-next-line no-console
  console.log('  test.can@demo.com  (karsilikli takip)\n');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
