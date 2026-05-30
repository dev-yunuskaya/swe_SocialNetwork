const request = require('supertest');
const {
  getApp,
  resetDatabase,
  registerUser,
  loginUser,
  authHeader,
  prisma,
} = require('./helpers');

describe('Notifications (FR 3.2.10)', () => {
  let authorToken;
  let readerToken;
  let authorId;

  beforeEach(async () => {
    await resetDatabase();
    const { payload: authorPayload } = await registerUser({
      username: 'notif_author',
      email: 'notif_author@test.com',
    });
    const { payload: readerPayload } = await registerUser({
      username: 'notif_reader',
      email: 'notif_reader@test.com',
    });

    authorToken = (await loginUser(authorPayload.email)).body.token;
    readerToken = (await loginUser(readerPayload.email)).body.token;
    authorId = (await loginUser(authorPayload.email)).body.user.id;

    const reader = (await loginUser(readerPayload.email)).body.user;
    await request(getApp())
      .post(`/api/users/${authorId}/follow`)
      .set(authHeader(readerToken));

    const post = await request(getApp())
      .post('/api/posts')
      .set(authHeader(authorToken))
      .field('content', 'Notification test post');

    await request(getApp())
      .post(`/api/posts/${post.body.id}/like`)
      .set(authHeader(readerToken));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/notifications - bildirimleri listeler', async () => {
    const res = await request(getApp())
      .get('/api/notifications')
      .set(authHeader(authorToken));

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some((n) => n.type === 'new_follower')).toBe(true);
    expect(res.body.some((n) => n.type === 'post_liked')).toBe(true);
    expect(res.body[0]).toHaveProperty('actor_username');
    expect(res.body[0]).toHaveProperty('is_read');
  });

  test('PATCH /api/notifications/:id/read - tek bildirimi okundu işaretler', async () => {
    const list = await request(getApp())
      .get('/api/notifications')
      .set(authHeader(authorToken));

    const target = list.body[0];
    const res = await request(getApp())
      .patch(`/api/notifications/${target.id}/read`)
      .set(authHeader(authorToken));

    expect(res.status).toBe(200);

    const updated = await prisma.notification.findUnique({ where: { id: target.id } });
    expect(updated.is_read).toBe(true);
  });

  test('PATCH /api/notifications/all/read - tüm bildirimleri okundu işaretler', async () => {
    const res = await request(getApp())
      .patch('/api/notifications/all/read')
      .set(authHeader(authorToken));

    expect(res.status).toBe(200);

    const unread = await prisma.notification.count({
      where: { user_id: authorId, is_read: false },
    });
    expect(unread).toBe(0);
  });

  test('PATCH /api/notifications/:id/read - geçersiz id HTTP 404', async () => {
    const res = await request(getApp())
      .patch('/api/notifications/99999/read')
      .set(authHeader(authorToken));

    expect(res.status).toBe(404);
  });
});
