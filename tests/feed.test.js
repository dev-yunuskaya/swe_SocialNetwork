const request = require('supertest');
const {
  getApp,
  resetDatabase,
  registerUser,
  loginUser,
  authHeader,
  prisma,
} = require('./helpers');

describe('Personalized Feed (FR 3.2.7)', () => {
  let tokenA;

  beforeEach(async () => {
    await resetDatabase();

    const { payload: payloadA } = await registerUser({ username: 'feed_a', email: 'feed_a@test.com' });
    const { payload: payloadB } = await registerUser({ username: 'feed_b', email: 'feed_b@test.com' });
    const { payload: payloadC } = await registerUser({ username: 'feed_c', email: 'feed_c@test.com' });

    tokenA = (await loginUser(payloadA.email)).body.token;
    const tokenB = (await loginUser(payloadB.email)).body.token;
    const userB = (await loginUser(payloadB.email)).body.user;
    const userC = (await loginUser(payloadC.email)).body.user;

    await request(getApp())
      .post(`/api/users/${userB.id}/follow`)
      .set(authHeader(tokenA));

    await request(getApp())
      .post('/api/posts')
      .set(authHeader(tokenB))
      .field('content', 'Post from B');

    await request(getApp())
      .post('/api/posts')
      .set(authHeader((await loginUser(payloadC.email)).body.token))
      .field('content', 'Post from C - not followed');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/feed - takip edilen kullanıcıların gönderilerini döner', async () => {
    const res = await request(getApp()).get('/api/feed').set(authHeader(tokenA));

    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
    expect(res.body.posts.every((p) => p.author.username === 'feed_b')).toBe(true);
  });

  test('GET /api/feed - kimseyi takip etmiyorsa boş liste', async () => {
    const { payload } = await registerUser({ username: 'lonely', email: 'lonely@test.com' });
    const login = await loginUser(payload.email);

    const res = await request(getApp()).get('/api/feed').set(authHeader(login.body.token));

    expect(res.status).toBe(200);
    expect(res.body.posts).toEqual([]);
  });

  test('GET /api/feed - cursor tabanlı sayfalama destekler', async () => {
    const tokenB = (await loginUser('feed_b@test.com')).body.token;
    for (let i = 0; i < 21; i += 1) {
      await request(getApp())
        .post('/api/posts')
        .set(authHeader(tokenB))
        .field('content', `Bulk post ${i}`);
    }

    const page1 = await request(getApp()).get('/api/feed').set(authHeader(tokenA));
    expect(page1.body.posts.length).toBeLessThanOrEqual(20);
    expect(page1.body.next_cursor).toBeTruthy();

    const page2 = await request(getApp())
      .get('/api/feed')
      .query({ cursor: page1.body.next_cursor })
      .set(authHeader(tokenA));

    expect(page2.status).toBe(200);
    expect(page2.body.posts.length).toBeGreaterThan(0);
  });

  test('GET /api/feed - exclude ile gorulen gonderiler filtrelenir', async () => {
    const tokenB = (await loginUser('feed_b@test.com')).body.token;
    for (let i = 0; i < 5; i += 1) {
      await request(getApp())
        .post('/api/posts')
        .set(authHeader(tokenB))
        .field('content', `Exclude test post ${i}`);
    }

    const all = await request(getApp()).get('/api/feed').set(authHeader(tokenA));
    const excludeIds = all.body.posts.slice(0, 2).map((p) => p.id).join(',');

    const filtered = await request(getApp())
      .get('/api/feed')
      .query({ exclude: excludeIds })
      .set(authHeader(tokenA));

    expect(filtered.status).toBe(200);
    const excluded = new Set(excludeIds.split(',').map(Number));
    expect(filtered.body.posts.every((p) => !excluded.has(p.id))).toBe(true);
  });
});
