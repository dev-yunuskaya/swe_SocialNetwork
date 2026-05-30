const { prisma } = require('../lib/prisma');
const { enrichPostsForViewer } = require('../utils/postEnrichment');
const { primaryHashtagFromPost } = require('../utils/hashtags');

const INTEREST_TO_TAG = {
  technology: 'technology',
  sports: 'sports',
  music: 'music',
  art: 'art',
  science: 'science',
  travel: 'travel',
  food: 'food',
  gaming: 'gaming',
};

const INTERACTION_WEIGHT = 8;
const INTEREST_WEIGHT = 5;
const AUTHOR_WEIGHT = 6;
const DISCOVERY_WEIGHT = 1;

/** 10 oneride ~8 ilgi alani, ~2 kesif */
const PROFILE_SLOT_RATIO = 0.8;

async function collectSignals(userId) {
  const userInterests = await prisma.userInterest.findMany({
    where: { user_id: userId },
    include: { interest: true },
  });

  const interestTags = userInterests.map((ui) =>
    (INTEREST_TO_TAG[ui.interest.name.toLowerCase()] || ui.interest.name).toLowerCase()
  );

  const likedPosts = await prisma.like.findMany({
    where: { user_id: userId },
    include: { post: { include: { hashtags: { include: { hashtag: true } } } } },
  });

  const commentedPosts = await prisma.comment.findMany({
    where: { user_id: userId },
    include: { post: { include: { hashtags: { include: { hashtag: true } } } } },
  });

  const interactionTags = new Set();
  const interactionAuthorIds = new Set();

  for (const like of likedPosts) {
    interactionAuthorIds.add(like.post.user_id);
    for (const ph of like.post.hashtags) {
      interactionTags.add(ph.hashtag.name.toLowerCase());
    }
  }
  for (const comment of commentedPosts) {
    interactionAuthorIds.add(comment.post.user_id);
    for (const ph of comment.post.hashtags) {
      interactionTags.add(ph.hashtag.name.toLowerCase());
    }
  }

  return {
    interestTags: [...new Set(interestTags)],
    interactionTags: [...interactionTags],
    interactionAuthorIds: [...interactionAuthorIds],
  };
}

function primaryTag(post) {
  return primaryHashtagFromPost(post);
}

function postTags(post) {
  return post.hashtags.map((ph) => ph.hashtag.name.toLowerCase());
}

function matchesInterestProfile(post, interestTags) {
  if (!interestTags.length) return false;
  const tags = postTags(post);
  return tags.some((t) => interestTags.includes(t));
}

function scorePost(post, signals) {
  let score = 0;
  let matchedProfileInterest = false;

  if (signals.interactionAuthorIds.includes(post.user_id)) {
    score += AUTHOR_WEIGHT;
  }

  const tags = postTags(post);
  for (const tag of tags) {
    if (signals.interactionTags.includes(tag)) {
      score += INTERACTION_WEIGHT;
    }
    if (signals.interestTags.includes(tag)) {
      score += INTEREST_WEIGHT;
      matchedProfileInterest = true;
    }
  }

  if (!matchedProfileInterest && tags.length > 0) {
    score += DISCOVERY_WEIGHT;
  }

  return score;
}

async function fetchCandidates(excludedUserIds, excludePostIds = []) {
  return prisma.post.findMany({
    where: {
      user_id: { notIn: [...excludedUserIds] },
      ...(excludePostIds.length ? { id: { notIn: excludePostIds } } : {}),
    },
    include: {
      user: { select: { id: true, username: true } },
      hashtags: { include: { hashtag: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { created_at: 'desc' },
  });
}

function shuffleKeys(keys, seed) {
  const arr = [...keys];
  let state = Number(seed) || Date.now();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mixByCategory(items, limit, seed) {
  const buckets = new Map();

  for (const item of items) {
    const tag = primaryTag(item.post ?? item);
    if (!buckets.has(tag)) buckets.set(tag, []);
    buckets.get(tag).push(item);
  }

  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const postA = a.post ?? a;
      const postB = b.post ?? b;
      return new Date(postB.created_at) - new Date(postA.created_at) || postB.id - postA.id;
    });
  }

  const tagOrder = shuffleKeys([...buckets.keys()], seed);
  const picked = [];
  let round = 0;

  while (picked.length < limit) {
    let added = false;
    for (const tag of tagOrder) {
      const bucket = buckets.get(tag);
      if (bucket.length > round) {
        const entry = bucket[round];
        picked.push(entry.post ?? entry);
        added = true;
        if (picked.length >= limit) break;
      }
    }
    if (!added) break;
    round += 1;
  }

  return picked;
}

function breakAdjacentSameTag(posts) {
  const result = [...posts];
  for (let i = 1; i < result.length; i += 1) {
    if (primaryTag(result[i]) === primaryTag(result[i - 1])) {
      for (let j = i + 1; j < result.length; j += 1) {
        if (primaryTag(result[j]) !== primaryTag(result[i - 1])) {
          const tmp = result[i];
          result[i] = result[j];
          result[j] = tmp;
          break;
        }
      }
    }
  }
  return result;
}

function mixByCategoryAndSmooth(items, limit, seed) {
  return breakAdjacentSameTag(mixByCategory(items, limit, seed));
}

/**
 * Ilgi alanlari agirlikli secim: limit'in %80'i profil hashtag'leri, %20 kesif.
 */
function selectWithProfileRatio(scored, limit, interestTags, seed) {
  if (!limit) return [];

  const profileItems = [];
  const discoveryItems = [];

  for (const entry of scored) {
    const post = entry.post ?? entry;
    if (matchesInterestProfile(post, interestTags)) {
      profileItems.push(entry);
    } else {
      discoveryItems.push(entry);
    }
  }

  const profileSlots = interestTags.length
    ? Math.max(1, Math.round(limit * PROFILE_SLOT_RATIO))
    : 0;
  let discoverySlots = interestTags.length ? limit - profileSlots : limit;

  if (!interestTags.length) {
    return mixByCategoryAndSmooth(scored, limit, seed);
  }

  let profilePicked = mixByCategoryAndSmooth(profileItems, profileSlots, seed);
  let discoveryPicked = mixByCategoryAndSmooth(discoveryItems, discoverySlots, seed + 17);

  if (profilePicked.length < profileSlots) {
    const extra = mixByCategoryAndSmooth(
      discoveryItems.filter((e) => !discoveryPicked.some((p) => p.id === (e.post ?? e).id)),
      profileSlots - profilePicked.length,
      seed + 31
    );
    profilePicked = [...profilePicked, ...extra];
  }
  if (discoveryPicked.length < discoverySlots) {
    const extra = mixByCategoryAndSmooth(
      profileItems.filter((e) => !profilePicked.some((p) => p.id === (e.post ?? e).id)),
      discoverySlots - discoveryPicked.length,
      seed + 47
    );
    discoveryPicked = [...discoveryPicked, ...extra];
  }

  return interleaveProfileAndDiscovery(profilePicked, discoveryPicked, limit);
}

/** Kesif icerikleri aralara serpiştir (orn. 10'da 2) */
function interleaveProfileAndDiscovery(profilePosts, discoveryPosts, limit) {
  const result = [];
  let pi = 0;
  let di = 0;
  const discoveryCount = discoveryPosts.length;
  const discoveryEvery =
    discoveryCount > 0 ? Math.max(2, Math.floor(limit / discoveryCount)) : limit + 1;

  for (let i = 0; i < limit; i += 1) {
    const useDiscovery =
      di < discoveryCount &&
      discoveryCount > 0 &&
      (i + 1) % discoveryEvery === 0 &&
      pi > 0;

    if (useDiscovery && di < discoveryPosts.length) {
      result.push(discoveryPosts[di]);
      di += 1;
    } else if (pi < profilePosts.length) {
      result.push(profilePosts[pi]);
      pi += 1;
    } else if (di < discoveryPosts.length) {
      result.push(discoveryPosts[di]);
      di += 1;
    } else {
      break;
    }
  }

  const seen = new Set();
  const unique = [];
  for (const p of result) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      unique.push(p);
    }
  }

  for (const p of [...profilePosts, ...discoveryPosts]) {
    if (unique.length >= limit) break;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      unique.push(p);
    }
  }

  return breakAdjacentSameTag(unique.slice(0, limit));
}

function pickRandomSample(posts, limit, seed) {
  const mixed = mixByCategoryAndSmooth(
    posts.map((post) => ({ post, score: 0 })),
    limit,
    seed
  );
  if (mixed.length >= limit || posts.length <= limit) {
    return mixed.length ? mixed : posts.slice(0, limit);
  }
  const pickedIds = new Set(mixed.map((p) => p.id));
  const rest = posts.filter((p) => !pickedIds.has(p.id));
  return [...mixed, ...pickRandomSample(rest, limit - mixed.length, seed + 1)];
}

async function recommend(userId, limit = 12, options = {}) {
  const { refresh = false, seed, excludeIds = [] } = options;

  const following = await prisma.follow.findMany({
    where: { follower_id: userId },
    select: { following_id: true },
  });
  const excludedUserIds = new Set([userId, ...following.map((f) => f.following_id)]);

  const candidates = await fetchCandidates([...excludedUserIds], excludeIds);
  const mixSeed = seed != null ? seed : userId + 7919;

  const signals = await collectSignals(userId);

  if (refresh) {
    const scored = candidates.map((post) => ({ post, score: 0 }));
    const mixed = selectWithProfileRatio(scored, limit, signals.interestTags, mixSeed);
    return enrichPostsForViewer(userId, mixed);
  }

  const scored = candidates.map((post) => ({ post, score: scorePost(post, signals) }));
  scored.sort((a, b) => b.score - a.score || b.post.id - a.post.id);

  const mixed = selectWithProfileRatio(scored, limit, signals.interestTags, mixSeed);
  return enrichPostsForViewer(userId, mixed);
}

module.exports = {
  collectSignals,
  scorePost,
  recommend,
  mixByCategory,
  mixByCategoryAndSmooth,
  breakAdjacentSameTag,
  selectWithProfileRatio,
  matchesInterestProfile,
  primaryTag,
  pickRandomSample,
  PROFILE_SLOT_RATIO,
  DISCOVERY_WEIGHT,
  INTERACTION_WEIGHT,
  INTEREST_WEIGHT,
};
