const request = require('supertest');
const {
  getApp,
  resetDatabase,
  registerUser,
  loginUser,
  authHeader,
  prisma,
} = require('./helpers');

describe('Follow / Unfollow (FR 3.2.4)', () => {
  let tokenA;
  let userB;

  beforeEach(async () => {
    await resetDatabase();
    const { payload: payloadA } = await registerUser({ username: 'user_a', email: 'a@test.com' });
    const { payload: payloadB } = await registerUser({ username: 'user_b', email: 'b@test.com' });

    const loginA = await loginUser(payloadA.email);
    tokenA = loginA.body.token;
    userB = (await loginUser(payloadB.email)).body.user;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /api/users/:id/follow - takip başarılı', async () => {
    const res = await request(getApp())
      .post(`/api/users/${userB.id}/follow`)
      .set(authHeader(tokenA));

    expect(res.status).toBe(200);

    const follow = await prisma.follow.findFirst({
      where: { follower_id: (await prisma.user.findUnique({ where: { email: 'a@test.com' } })).id, following_id: userB.id },
    });
    expect(follow).not.toBeNull();
  });

  test('POST /api/users/:id/follow - kendini takip HTTP 400', async () => {
    const userA = await prisma.user.findUnique({ where: { email: 'a@test.com' } });
    const res = await request(getApp())
      .post(`/api/users/${userA.id}/follow`)
      .set(authHeader(tokenA));

    expect(res.status).toBe(400);
  });

  test('POST /api/users/:id/follow - olmayan kullanıcı HTTP 404', async () => {
    const res = await request(getApp())
      .post('/api/users/99999/follow')
      .set(authHeader(tokenA));

    expect(res.status).toBe(404);
  });

  test('POST /api/users/:id/follow - idempotent (tekrar takip HTTP 200)', async () => {
    await request(getApp())
      .post(`/api/users/${userB.id}/follow`)
      .set(authHeader(tokenA));

    const res = await request(getApp())
      .post(`/api/users/${userB.id}/follow`)
      .set(authHeader(tokenA));

    expect(res.status).toBe(200);
  });

  test('DELETE /api/users/:id/follow - takipten çıkma', async () => {
    await request(getApp())
      .post(`/api/users/${userB.id}/follow`)
      .set(authHeader(tokenA));

    const res = await request(getApp())
      .delete(`/api/users/${userB.id}/follow`)
      .set(authHeader(tokenA));

    expect(res.status).toBe(200);
  });

  test('Takip sonrası new_follower bildirimi oluşur', async () => {
    await request(getApp())
      .post(`/api/users/${userB.id}/follow`)
      .set(authHeader(tokenA));

    const notifications = await prisma.notification.findMany({
      where: { user_id: userB.id, type: 'new_follower' },
    });
    expect(notifications.length).toBe(1);
  });
});
