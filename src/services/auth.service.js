const bcrypt = require('bcrypt');
const { prisma } = require('../lib/prisma');
const { httpError } = require('../middleware/errorHandler');
const { signToken } = require('../utils/jwt');

const PREDEFINED_INTERESTS = [
  'Technology',
  'Sports',
  'Music',
  'Art',
  'Science',
  'Travel',
  'Food',
  'Gaming',
];

async function ensureInterestsExist() {
  for (const name of PREDEFINED_INTERESTS) {
    await prisma.interest.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
}

function validateRegistration({ username, email, password, interests }) {
  if (!username || username.length < 3 || username.length > 30) {
    throw httpError(400, 'Username must be 3-30 characters');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, 'Invalid email format');
  }
  if (!password || password.length < 8) {
    throw httpError(400, 'Password must be at least 8 characters');
  }
  if (!interests || !Array.isArray(interests) || interests.length === 0) {
    throw httpError(400, 'At least one interest must be selected');
  }
}

async function register({ username, email, password, interests }) {
  validateRegistration({ username, email, password, interests });
  await ensureInterestsExist();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    throw httpError(409, 'Username or email already exists');
  }

  const interestRecords = await prisma.interest.findMany({
    where: { name: { in: interests } },
  });
  if (interestRecords.length !== interests.length) {
    throw httpError(400, 'Invalid interest selection');
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password_hash,
      interests: {
        create: interestRecords.map((i) => ({ interest_id: i.id })),
      },
    },
  });

  return { id: user.id, username: user.username, email: user.email };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw httpError(401, 'Invalid credentials');
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw httpError(401, 'Invalid credentials');
  }
  const token = signToken(user);
  return { token, user: { id: user.id, username: user.username, email: user.email } };
}

module.exports = { register, login, PREDEFINED_INTERESTS, ensureInterestsExist };
