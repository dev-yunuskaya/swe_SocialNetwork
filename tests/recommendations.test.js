const request = require('supertest');
const {
  scorePost,
  mixByCategory,
  selectWithProfileRatio,
  matchesInterestProfile,
  PROFILE_SLOT_RATIO,
  DISCOVERY_WEIGHT,
  INTERACTION_WEIGHT,
  INTEREST_WEIGHT,
} = require('../src/services/recommendation.service');
const {
  getApp,
  resetDatabase,
  registerUser,
  loginUser,
  authHeader,
  prisma,
} = require('./helpers');

describe('Recommendation Engine (FR 3.2.8)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('scorePost unit tests', () => {
    test('eşleşen hashtag sayısına göre skor hesaplar (etkilesim agirlikli)', () => {
      const post = {
        hashtags: [
          { hashtag: { name: 'technology' } },
          { hashtag: { name: 'science' } },
        ],
      };
      const signals = {
        interestTags: ['technology'],
        interactionTags: ['science'],
        interactionAuthorIds: [],
      };

      expect(scorePost(post, signals)).toBe(INTERACTION_WEIGHT + INTEREST_WEIGHT);
    });

    test('begendigim yazarın gonderileri yuksek skor alir', () => {
      const post = {
        user_id: 42,
        hashtags: [{ hashtag: { name: 'travel' } }],
      };
      const signals = {
        interestTags: [],
        interactionTags: [],
        interactionAuthorIds: [42],
      };
      expect(scorePost(post, signals)).toBe(6 + DISCOVERY_WEIGHT);
    });

    test('begeni sinyali ilgi alanindan daha agirlikli', () => {
      const post = { user_id: 1, hashtags: [{ hashtag: { name: 'technology' } }] };
      const fromLike = scorePost(post, {
        interestTags: [],
        interactionTags: ['technology'],
        interactionAuthorIds: [],
      });
      const fromInterest = scorePost(post, {
        interestTags: ['technology'],
        interactionTags: [],
        interactionAuthorIds: [],
      });
      expect(fromLike).toBeGreaterThan(fromInterest);
    });

    test('profil disi hashtag discovery puani alir', () => {
      const post = { user_id: 1, hashtags: [{ hashtag: { name: 'travel' } }] };
      const signals = { interestTags: ['music'], interactionTags: [], interactionAuthorIds: [] };
      expect(scorePost(post, signals)).toBe(DISCOVERY_WEIGHT);
    });

    test('etkilesim hashtag puani artirildi', () => {
      const post = {
        user_id: 1,
        hashtags: [{ hashtag: { name: 'art' } }],
      };
      const signals = {
        interestTags: ['technology'],
        interactionTags: ['art'],
        interactionAuthorIds: [],
      };
      expect(scorePost(post, signals)).toBe(INTERACTION_WEIGHT + DISCOVERY_WEIGHT); // 8 + 1
    });
  });

  describe('selectWithProfileRatio', () => {
    test('10 icerikte yaklasik %80 ilgi alani %20 kesif', () => {
      const scored = [];
      for (let i = 0; i < 20; i += 1) {
        const tag = i < 16 ? 'technology' : 'travel';
        scored.push({
          post: {
            id: i + 1,
            created_at: new Date(i),
            hashtags: [{ hashtag: { name: tag } }],
          },
          score: tag === 'technology' ? 10 : 1,
        });
      }
      const picked = selectWithProfileRatio(scored, 10, ['technology'], 42);
      const profileCount = picked.filter((p) =>
        matchesInterestProfile(p, ['technology'])
      ).length;
      expect(profileCount).toBeGreaterThanOrEqual(7);
      expect(profileCount).toBeLessThanOrEqual(9);
      expect(picked.length).toBe(10);
    });
  });

  describe('mixByCategory', () => {
    test('farkli hashtagleri round-robin ile karistirir', () => {
      const items = [
        { post: { id: 1, created_at: 1, hashtags: [{ hashtag: { name: 'art' } }] }, score: 10 },
        { post: { id: 2, created_at: 2, hashtags: [{ hashtag: { name: 'art' } }] }, score: 9 },
        { post: { id: 3, created_at: 3, hashtags: [{ hashtag: { name: 'sports' } }] }, score: 8 },
        { post: { id: 4, created_at: 4, hashtags: [{ hashtag: { name: 'technology' } }] }, score: 7 },
      ];
      const mixed = mixByCategory(items, 4, 99);
      const tags = mixed.map((p) => p.hashtags[0].hashtag.name);
      expect(new Set(tags).size).toBeGreaterThan(1);
      expect(tags[0]).not.toBe(tags[1]);
    });
  });

  describe('GET /api/recommendations integration', () => {
    beforeEach(async () => {
      await resetDatabase();

      const { payload: viewerPayload } = await registerUser({
        username: 'viewer',
        email: 'viewer@test.com',
        interests: ['Technology'],
      });
      const { payload: authorPayload } = await registerUser({
        username: 'rec_author',
        email: 'rec_author@test.com',
      });

      const viewerToken = (await loginUser(viewerPayload.email)).body.token;
      const authorToken = (await loginUser(authorPayload.email)).body.token;

      await request(getApp())
        .post('/api/posts')
        .set(authHeader(authorToken))
        .field('content', 'Check this #technology innovation');

      await request(getApp())
        .post('/api/posts')
        .set(authHeader(authorToken))
        .field('content', 'Unrelated #travel photo');

      const res = await request(getApp())
        .get('/api/recommendations')
        .set(authHeader(viewerToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeLessThanOrEqual(10);
    });

    test('kendi gönderileri önerilmez', async () => {
      const { payload } = await registerUser({
        username: 'self_user',
        email: 'self_user@test.com',
        interests: ['Music'],
      });
      const token = (await loginUser(payload.email)).body.token;

      await request(getApp())
        .post('/api/posts')
        .set(authHeader(token))
        .field('content', 'My own #music post');

      const res = await request(getApp())
        .get('/api/recommendations')
        .set(authHeader(token));

      expect(res.body.every((p) => p.author?.username !== 'self_user')).toBe(true);
    });

    test('exclude ile yenileme tekrar gostermez', async () => {
      const { payload: viewerPayload } = await registerUser({
        username: 'viewer_ex',
        email: 'viewer_ex@test.com',
        interests: ['Technology'],
      });
      const { payload: authorPayload } = await registerUser({
        username: 'author_ex',
        email: 'author_ex@test.com',
      });

      const viewerToken = (await loginUser(viewerPayload.email)).body.token;
      const authorToken = (await loginUser(authorPayload.email)).body.token;

      const postIds = [];
      for (let i = 0; i < 15; i += 1) {
        const created = await request(getApp())
          .post('/api/posts')
          .set(authHeader(authorToken))
          .field('content', `Tech batch ${i} #technology`);
        postIds.push(created.body.id);
      }

      const first = await request(getApp())
        .get('/api/recommendations')
        .set(authHeader(viewerToken));
      expect(first.body.length).toBeGreaterThan(0);

      const exclude = first.body.map((p) => p.id);
      const second = await request(getApp())
        .post('/api/recommendations/refresh')
        .set(authHeader(viewerToken))
        .send({ exclude, seed: 42 });

      expect(second.status).toBe(200);
      const overlap = second.body.filter((p) => exclude.includes(p.id));
      expect(overlap.length).toBe(0);
    });
  });
});
