const request = require('supertest');
const bcrypt = require('bcrypt');
const {
  getApp,
  resetDatabase,
  registerUser,
  loginUser,
  authHeader,
  prisma,
} = require('./helpers');

describe('Auth & Registration (FR 3.2.1, 3.2.2)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /api/register - başarılı kayıt HTTP 201 döner', async () => {
    const { payload, response } = await registerUser({
      interests: ['Technology', 'Sports'],
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      username: payload.username,
      email: payload.email,
    });
    expect(response.body.id).toBeDefined();
  });

  test('POST /api/register - ilgi alanı seçilmezse HTTP 400', async () => {
    const res = await request(getApp()).post('/api/register').send({
      username: 'testuser1',
      email: 'test1@test.com',
      password: 'password123',
      interests: [],
    });

    expect(res.status).toBe(400);
  });

  test('POST /api/register - duplicate username/email HTTP 409', async () => {
    await registerUser({ username: 'alice', email: 'alice@test.com' });

    const res = await request(getApp()).post('/api/register').send({
      username: 'alice',
      email: 'other@test.com',
      password: 'password123',
      interests: ['Music'],
    });

    expect(res.status).toBe(409);
  });

  test('POST /api/register - şifre hashlenmiş olarak saklanır', async () => {
    const { payload } = await registerUser({ password: 'password123' });
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    expect(user.password_hash).not.toBe('password123');
    expect(await bcrypt.compare('password123', user.password_hash)).toBe(true);
  });

  test('POST /api/login - geçerli kimlik bilgileri JWT döner', async () => {
    const { payload } = await registerUser();
    const res = await loginUser(payload.email);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(payload.email);
  });

  test('POST /api/login - geçersiz kimlik bilgileri HTTP 401', async () => {
    const res = await request(getApp()).post('/api/login').send({
      email: 'nobody@test.com',
      password: 'wrongpass',
    });

    expect(res.status).toBe(401);
  });

  test('POST /api/logout - HTTP 200 döner', async () => {
    const { payload } = await registerUser();
    const login = await loginUser(payload.email);

    const res = await request(getApp())
      .post('/api/logout')
      .set(authHeader(login.body.token));

    expect(res.status).toBe(200);
  });

  test('Korumalı endpoint geçersiz JWT ile HTTP 401', async () => {
    const res = await request(getApp())
      .get('/api/feed')
      .set({ Authorization: 'Bearer invalid.token.here' });

    expect(res.status).toBe(401);
  });
});
