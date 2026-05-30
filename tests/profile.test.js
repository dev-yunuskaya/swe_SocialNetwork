const request = require('supertest');
const {
  getApp,
  resetDatabase,
  registerUser,
  loginUser,
  authHeader,
  prisma,
} = require('./helpers');

describe('Profile Management (FR 3.2.3)', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await resetDatabase();
    const { payload } = await registerUser();
    const login = await loginUser(payload.email);
    token = login.body.token;
    userId = login.body.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/users/:id - profil bilgilerini döner', async () => {
    const res = await request(getApp()).get(`/api/users/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: userId,
      follower_count: 0,
      following_count: 0,
      post_count: 0,
    });
    expect(res.body.interests).toContain('Technology');
  });

  test('PUT /api/profile - kendi profilini günceller', async () => {
    const res = await request(getApp())
      .put('/api/profile')
      .set(authHeader(token))
      .send({
        display_name: 'Yunus',
        bio: 'SWE student',
        interests: ['Science', 'Travel'],
      });

    expect(res.status).toBe(200);
    expect(res.body.display_name).toBe('Yunus');
    expect(res.body.bio).toBe('SWE student');
    expect(res.body.interests).toEqual(expect.arrayContaining(['Science', 'Travel']));
  });

  test('GET /api/users/:username - username ile profil görüntüleme', async () => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const res = await request(getApp()).get(`/api/users/${user.username}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe(user.username);
  });

  test('GET /api/users/:id - olmayan kullanıcı HTTP 404', async () => {
    const res = await request(getApp()).get('/api/users/99999');
    expect(res.status).toBe(404);
  });

  test('PUT /api/profile - JWT olmadan HTTP 401', async () => {
    const res = await request(getApp()).put('/api/profile').send({ bio: 'hack' });
    expect(res.status).toBe(401);
  });
});
