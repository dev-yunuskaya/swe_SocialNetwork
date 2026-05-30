const { prisma } = require('../src/lib/prisma');
const { createApp } = require('../src/app');
const { ensureInterestsExist } = require('../src/services/auth.service');

let app;

async function resetDatabase() {
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.postHashtag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.hashtag.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.user.deleteMany();
  await ensureInterestsExist();
}

function getApp() {
  if (!app) {
    app = createApp();
  }
  return app;
}

async function registerUser(overrides = {}) {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const payload = {
    username: overrides.username || `user_${suffix}`,
    email: overrides.email || `user_${suffix}@test.com`,
    password: overrides.password || 'password123',
    interests: overrides.interests || ['Technology'],
  };

  const request = require('supertest')(getApp());
  const response = await request.post('/api/register').send(payload);
  return { payload, response };
}

async function loginUser(email, password = 'password123') {
  const request = require('supertest')(getApp());
  const response = await request.post('/api/login').send({ email, password });
  return response;
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  prisma,
  getApp,
  resetDatabase,
  registerUser,
  loginUser,
  authHeader,
};
