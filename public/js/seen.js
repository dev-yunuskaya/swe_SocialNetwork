/** Tracks seen recommendation post IDs (For You tab only) */
function seenStorageKey() {
  const user = typeof getUser === 'function' ? getUser() : null;
  if (user?.id != null) return `social_network_seen_recommendations_${user.id}`;
  if (user?.username) return `social_network_seen_recommendations_u_${user.username}`;
  return 'social_network_seen_recommendations_guest';
}

const LEGACY_KEYS = [
  'social_network_seen_posts',
  (user) => (user?.id ? `social_network_seen_${user.id}` : null),
];

const MAX_SEEN = 800;

function migrateLegacySeen() {
  const user = typeof getUser === 'function' ? getUser() : null;
  const target = seenStorageKey();
  if (localStorage.getItem(target)) return;

  const merged = new Set();
  for (const key of LEGACY_KEYS) {
    const k = typeof key === 'function' ? key(user) : key;
    if (!k) continue;
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      JSON.parse(raw).forEach((id) => {
        const n = Number(id);
        if (Number.isInteger(n) && n > 0) merged.add(n);
      });
    } catch {
      /* ignore */
    }
  }
  if (merged.size) {
    localStorage.setItem(target, JSON.stringify([...merged]));
  }
}

function getSeenIds() {
  migrateLegacySeen();
  try {
    return JSON.parse(localStorage.getItem(seenStorageKey()) || '[]')
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
}

function hasSeenRecommendations() {
  return getSeenIds().length > 0;
}

function markRecommendationIdsSeen(ids) {
  if (!ids?.length) return;
  const set = new Set(getSeenIds());
  for (const raw of ids) {
    const id = Number(raw);
    if (Number.isInteger(id) && id > 0) set.add(id);
  }
  localStorage.setItem(seenStorageKey(), JSON.stringify([...set].slice(-MAX_SEEN)));
}

function markRecommendationsSeen(posts) {
  if (!posts?.length) return;
  markRecommendationIdsSeen(posts.map((p) => p.id));
}

function clearSeenRecommendations() {
  localStorage.removeItem(seenStorageKey());
  for (const key of LEGACY_KEYS) {
    const user = typeof getUser === 'function' ? getUser() : null;
    const k = typeof key === 'function' ? key(user) : key;
    if (k) localStorage.removeItem(k);
  }
  localStorage.removeItem('social_network_seen_posts');
}

function captureVisibleRecommendationIds() {
  return [...document.querySelectorAll('#recommendList .interactive-post')]
    .map((el) => Number(el.dataset.postId))
    .filter((id) => Number.isInteger(id) && id > 0);
}
