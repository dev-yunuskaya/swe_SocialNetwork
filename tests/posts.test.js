const request = require('supertest');
const path = require('path');
const fs = require('fs');
const {
  getApp,
  resetDatabase,
  registerUser,
  loginUser,
  authHeader,
  prisma,
} = require('./helpers');

describe('Post Management (FR 3.2.5)', () => {
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

  test('POST /api/posts - metin gönderisi oluşturur ve hashtag çıkarır', async () => {
    const res = await request(getApp())
      .post('/api/posts')
      .set(authHeader(token))
      .field('content', 'Hello #technology world #science');

    expect(res.status).toBe(201);
    expect(res.body.content).toContain('#technology');
    expect(res.body.hashtags).toEqual(expect.arrayContaining(['technology', 'science']));
  });

  test('POST /api/posts - boş içerik HTTP 400', async () => {
    const res = await request(getApp())
      .post('/api/posts')
      .set(authHeader(token))
      .field('content', '   ');

    expect(res.status).toBe(400);
  });

  test('POST /api/posts - 500 karakterden uzun içerik HTTP 400', async () => {
    const res = await request(getApp())
      .post('/api/posts')
      .set(authHeader(token))
      .field('content', 'a'.repeat(501));

    expect(res.status).toBe(400);
  });

  test('DELETE /api/posts/:id - yazar kendi gönderisini siler', async () => {
    const created = await request(getApp())
      .post('/api/posts')
      .set(authHeader(token))
      .field('content', 'To be deleted');

    const res = await request(getApp())
      .delete(`/api/posts/${created.body.id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    const post = await prisma.post.findUnique({ where: { id: created.body.id } });
    expect(post).toBeNull();
  });

  test('DELETE /api/posts/:id - başkasının gönderisi HTTP 403', async () => {
    const created = await request(getApp())
      .post('/api/posts')
      .set(authHeader(token))
      .field('content', 'Protected post');

    const { payload: otherPayload } = await registerUser({
      username: 'other_user',
      email: 'other@test.com',
    });
    const otherLogin = await loginUser(otherPayload.email);

    const res = await request(getApp())
      .delete(`/api/posts/${created.body.id}`)
      .set(authHeader(otherLogin.body.token));

    expect(res.status).toBe(403);
  });

  test('POST /api/posts - geçersiz resim tipi HTTP 400', async () => {
    const uploadDir = path.join(process.cwd(), 'uploads-test');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const txtPath = path.join(uploadDir, 'bad.txt');
    fs.writeFileSync(txtPath, 'not an image');

    const res = await request(getApp())
      .post('/api/posts')
      .set(authHeader(token))
      .field('content', 'With bad image')
      .attach('image', txtPath);

    expect(res.status).toBe(400);
  });
});

describe('Likes and Comments (FR 3.2.6)', () => {
  let authorToken;
  let readerToken;
  let postId;

  beforeEach(async () => {
    await resetDatabase();
    const { payload: authorPayload } = await registerUser({
      username: 'author',
      email: 'author@test.com',
    });
    const { payload: readerPayload } = await registerUser({
      username: 'reader',
      email: 'reader@test.com',
    });

    authorToken = (await loginUser(authorPayload.email)).body.token;
    readerToken = (await loginUser(readerPayload.email)).body.token;

    const post = await request(getApp())
      .post('/api/posts')
      .set(authHeader(authorToken))
      .field('content', 'Like me #music');

    postId = post.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /api/posts/:id/like - beğeni oluşturur', async () => {
    const res = await request(getApp())
      .post(`/api/posts/${postId}/like`)
      .set(authHeader(readerToken));

    expect(res.status).toBe(200);
  });

  test('POST /api/posts/:id/like - duplicate like HTTP 409', async () => {
    await request(getApp())
      .post(`/api/posts/${postId}/like`)
      .set(authHeader(readerToken));

    const res = await request(getApp())
      .post(`/api/posts/${postId}/like`)
      .set(authHeader(readerToken));

    expect(res.status).toBe(409);
  });

  test('DELETE /api/posts/:id/like - beğeniyi kaldırır', async () => {
    await request(getApp())
      .post(`/api/posts/${postId}/like`)
      .set(authHeader(readerToken));

    const res = await request(getApp())
      .delete(`/api/posts/${postId}/like`)
      .set(authHeader(readerToken));

    expect(res.status).toBe(200);
  });

  test('POST /api/posts/:id/comments - yorum ekler', async () => {
    const res = await request(getApp())
      .post(`/api/posts/${postId}/comments`)
      .set(authHeader(readerToken))
      .send({ content: 'Great post!' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Great post!');
  });

  test('DELETE /api/comments/:id - sadece yazar silebilir', async () => {
    const comment = await request(getApp())
      .post(`/api/posts/${postId}/comments`)
      .set(authHeader(readerToken))
      .send({ content: 'My comment' });

    const forbidden = await request(getApp())
      .delete(`/api/comments/${comment.body.id}`)
      .set(authHeader(authorToken));

    expect(forbidden.status).toBe(403);

    const allowed = await request(getApp())
      .delete(`/api/comments/${comment.body.id}`)
      .set(authHeader(readerToken));

    expect(allowed.status).toBe(200);
  });

  test('Beğeni ve yorum post_liked / post_commented bildirimi oluşturur', async () => {
    await request(getApp())
      .post(`/api/posts/${postId}/like`)
      .set(authHeader(readerToken));

    await request(getApp())
      .post(`/api/posts/${postId}/comments`)
      .set(authHeader(readerToken))
      .send({ content: 'Nice!' });

    const author = await prisma.user.findUnique({ where: { email: 'author@test.com' } });
    const notifications = await prisma.notification.findMany({ where: { user_id: author.id } });
    const types = notifications.map((n) => n.type);

    expect(types).toContain('post_liked');
    expect(types).toContain('post_commented');
  });

  test('Begeni profil disi hashtag ile ilgi alani ogrenir', async () => {
    await prisma.interest.upsert({
      where: { name: 'Travel' },
      create: { name: 'Travel' },
      update: {},
    });

    const travelPost = await request(getApp())
      .post('/api/posts')
      .set(authHeader(authorToken))
      .field('content', 'Trip notes #travel');

    await request(getApp())
      .post(`/api/posts/${travelPost.body.id}/like`)
      .set(authHeader(readerToken));

    const reader = await prisma.user.findUnique({
      where: { email: 'reader@test.com' },
      include: { interests: { include: { interest: true } } },
    });
    const names = reader.interests.map((ui) => ui.interest.name);
    expect(names).toContain('Travel');
  });

  test('Yorum yaniti comment_replied bildirimi olusturur', async () => {
    const parent = await request(getApp())
      .post(`/api/posts/${postId}/comments`)
      .set(authHeader(readerToken))
      .send({ content: 'Ilk yorum' });

    await request(getApp())
      .post(`/api/posts/${postId}/comments`)
      .set(authHeader(authorToken))
      .send({ content: 'Yanit', parent_comment_id: parent.body.id });

    const reader = await prisma.user.findUnique({ where: { email: 'reader@test.com' } });
    const notifications = await prisma.notification.findMany({ where: { user_id: reader.id } });
    expect(notifications.some((n) => n.type === 'comment_replied')).toBe(true);
  });
});
