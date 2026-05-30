/**
 * Tek demo: 2 giris hesabi + 8 icerik uretici (oneriler icin)
 * 200 anlamli gonderi (~yarisi gorselli), tum seed tek komutta
 */
const P = (user, content, imageSeed) => ({ user, content, imageSeed: imageSeed || null });
const POST_LINES = require('./demo-posts');

const INTEREST_AREAS = [
  'Technology',
  'Sports',
  'Music',
  'Art',
  'Science',
  'Travel',
  'Food',
  'Gaming',
];

const INTEREST = {
  tech: ['Technology'],
  sport: ['Sports'],
  music: ['Music'],
  art: ['Art'],
  science: ['Science'],
  travel: ['Travel'],
  food: ['Food'],
  gaming: ['Gaming'],
  mixed: ['Technology', 'Sports'],
};

const mkUser = (username, display_name, bio, interests, email) => ({
  username,
  email: email || `${username.replace(/_/g, '.')}@demo.com`,
  password: 'password123',
  interests,
  bio,
  display_name,
});

/** Sadece bu iki hesapla giris yapilir */
const DEMO_LOGIN_USERS = [
  mkUser('demo_ayse', 'Ayse Test', 'Demo hesap — Can ile karsilikli takip', INTEREST.mixed, 'test.ayse@demo.com'),
  mkUser('demo_can', 'Can Test', 'Demo hesap — Ayse ile karsilikli takip', INTEREST.mixed, 'test.can@demo.com'),
];

/** Oneri havuzu: takip edilmeyen icerik ureticileri */
const CONTENT_AUTHORS = [
  mkUser('pool_tech', 'Pool Tech', 'Teknoloji icerik', INTEREST.tech),
  mkUser('pool_sport', 'Pool Sport', 'Spor icerik', INTEREST.sport),
  mkUser('pool_music', 'Pool Music', 'Muzik icerik', INTEREST.music),
  mkUser('pool_art', 'Pool Art', 'Sanat icerik', INTEREST.art),
  mkUser('pool_science', 'Pool Science', 'Bilim icerik', INTEREST.science),
  mkUser('pool_travel', 'Pool Travel', 'Seyahat icerik', INTEREST.travel),
  mkUser('pool_food', 'Pool Food', 'Yemek icerik', INTEREST.food),
  mkUser('pool_gaming', 'Pool Gaming', 'Oyun icerik', INTEREST.gaming),
];

const DEMO_CLUSTERS = {
  tech: ['pool_tech'],
  sport: ['pool_sport'],
  music: ['pool_music'],
  art: ['pool_art'],
  science: ['pool_science'],
  travel: ['pool_travel'],
  food: ['pool_food'],
  gaming: ['pool_gaming'],
  mutual: ['demo_ayse', 'demo_can'],
};

const DEMO_USERS = [...DEMO_LOGIN_USERS, ...CONTENT_AUTHORS];

const CATEGORY_MAP = [
  { tag: 'technology', cluster: 'tech' },
  { tag: 'sports', cluster: 'sport' },
  { tag: 'music', cluster: 'music' },
  { tag: 'art', cluster: 'art' },
  { tag: 'science', cluster: 'science' },
  { tag: 'travel', cluster: 'travel' },
  { tag: 'food', cluster: 'food' },
  { tag: 'gaming', cluster: 'gaming' },
];

function slugImageSeed(hashtag, text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  return `${hashtag}-${words.join('-')}`.slice(0, 48);
}

function buildCategoryPosts(hashtag, clusterKey, lines) {
  const users = DEMO_CLUSTERS[clusterKey];
  return lines.map((line, i) => {
    const user = users[i % users.length];
    const content = `${line.t} #${hashtag}`;
    const withImage = i % 2 === 0;
    const imageSeed = withImage ? line.img || slugImageSeed(hashtag, line.t) : null;
    return P(user, content, imageSeed);
  });
}

const DEMO_POSTS = [
  ...CATEGORY_MAP.flatMap(({ tag, cluster }) =>
    buildCategoryPosts(tag, cluster, POST_LINES[tag])
  ),
  P('demo_ayse', 'Merhaba Can! Ortak takip testi — feed ve mesaj. #technology', 'team-onboarding-office'),
  P('demo_ayse', 'Sprint review notlari paylasildi. #technology'),
  P('demo_can', 'Selam Ayse! Karsilikli takip calisiyor. #sports', 'football-stadium-crowd'),
  P('demo_can', 'Antrenman ozeti: 6x800m interval. #sports'),
];

const DEMO_MUTUAL_FOLLOWS = [
  ['demo_ayse', 'demo_can'],
  ['demo_can', 'demo_ayse'],
];

module.exports = {
  DEMO_CLUSTERS,
  DEMO_USERS,
  DEMO_LOGIN_USERS,
  DEMO_POSTS,
  DEMO_MUTUAL_FOLLOWS,
  DEMO_FOLLOWS: [],
  INTEREST_AREAS,
};
