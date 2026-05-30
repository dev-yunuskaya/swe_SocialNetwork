const request = require('supertest');
const {
  getApp,
  resetDatabase,
  registerUser,
  loginUser,
  authHeader,
  prisma,
} = require('./helpers');

describe('Direct Messaging (FR 3.2.9)', () => {
  let tokenA;
  let userB;

  beforeEach(async () => {
    await resetDatabase();
    const { payload: payloadA } = await registerUser({ username: 'msg_a', email: 'msg_a@test.com' });
    const { payload: payloadB } = await registerUser({ username: 'msg_b', email: 'msg_b@test.com' });

    tokenA = (await loginUser(payloadA.email)).body.token;
    userB = (await loginUser(payloadB.email)).body.user;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /api/messages - mesaj gönderir HTTP 201', async () => {
    const res = await request(getApp())
      .post('/api/messages')
      .set(authHeader(tokenA))
      .send({ recipient_id: userB.id, content: 'Merhaba!' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Merhaba!');
  });

  test('POST /api/messages - boş mesaj HTTP 400', async () => {
    const res = await request(getApp())
      .post('/api/messages')
      .set(authHeader(tokenA))
      .send({ recipient_id: userB.id, content: '   ' });

    expect(res.status).toBe(400);
  });

  test('POST /api/messages - olmayan alıcı HTTP 404', async () => {
    const res = await request(getApp())
      .post('/api/messages')
      .set(authHeader(tokenA))
      .send({ recipient_id: 99999, content: 'Hello' });

    expect(res.status).toBe(404);
  });

  test('GET /api/messages/:partner_id - konuşma geçmişi artan sırada', async () => {
    await request(getApp())
      .post('/api/messages')
      .set(authHeader(tokenA))
      .send({ recipient_id: userB.id, content: 'First' });

    const tokenB = (await loginUser('msg_b@test.com')).body.token;
    await request(getApp())
      .post('/api/messages')
      .set(authHeader(tokenB))
      .send({ recipient_id: (await prisma.user.findUnique({ where: { email: 'msg_a@test.com' } })).id, content: 'Reply' });

    const res = await request(getApp())
      .get(`/api/messages/${userB.id}`)
      .set(authHeader(tokenA));

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].content).toBe('First');
    expect(res.body[1].content).toBe('Reply');
  });
});
