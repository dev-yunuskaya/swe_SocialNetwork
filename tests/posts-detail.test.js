const request = require('supertest');
const {
  getApp,
  resetDatabase,
  registerUser,
  loginUser,
  authHeader,
  prisma,
} = require('./helpers');

describe('Post detail & user posts', () => {
  let token;
  let postId;

  beforeEach(async () => {
    await resetDatabase();
    const { payload } = await registerUser({ username: 'detail_user', email: 'detail@test.com' });
    token = (await loginUser(payload.email)).body.token;

    const post = await request(getApp())
      .post('/api/posts')
      .set(authHeader(token))
      .field('content', 'Detail post #tech');

    postId = post.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/me - oturum acik kullanici', async () => {
    const res = await request(getApp()).get('/api/me').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('detail_user');
    expect(res.body.is_self).toBe(true);
  });

  test('GET /api/posts/:id - gonderi ve yorumlar', async () => {
    await request(getApp())
      .post(`/api/posts/${postId}/comments`)
      .set(authHeader(token))
      .send({ content: 'Nice' });

    const res = await request(getApp()).get(`/api/posts/${postId}`).set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.liked_by_me).toBe(false);
  });

  test('GET /api/users/:id/posts - kullanici gonderileri', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'detail@test.com' } });
    const res = await request(getApp()).get(`/api/users/${user.id}/posts`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('GET /api/messages - konusma listesi', async () => {
    const { payload: b } = await registerUser({ username: 'msg_b2', email: 'msg_b2@test.com' });
    const userB = (await loginUser(b.email)).body.user;

    await request(getApp())
      .post('/api/messages')
      .set(authHeader(token))
      .send({ recipient_id: userB.id, content: 'Hello' });

    const res = await request(getApp()).get('/api/messages').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].partner_username).toBe('msg_b2');
  });
});
