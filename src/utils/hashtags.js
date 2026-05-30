/** Bilinen icerik kategorileri (hashtag -> gosterim) */
const KNOWN_CATEGORY_TAGS = new Set([
  'technology',
  'sports',
  'music',
  'art',
  'science',
  'travel',
  'food',
  'gaming',
]);

function isValidHashtagName(name) {
  if (!name || typeof name !== 'string') return false;
  const tag = name.toLowerCase().trim();
  if (tag.length < 2) return false;
  if (/^\d+$/.test(tag)) return false;
  return true;
}

function isCategoryTag(name) {
  return isValidHashtagName(name) && KNOWN_CATEGORY_TAGS.has(name.toLowerCase());
}

function extractHashtags(text) {
  const matches = text.match(/#[\w\u00C0-\u024F]+/gi) || [];
  return [
    ...new Set(
      matches
        .map((tag) => tag.slice(1).toLowerCase())
        .filter(isValidHashtagName)
    ),
  ];
}

/** Rozet ve oneri icin ilk gecerli kategori hashtag'i */
function primaryHashtagFromNames(names) {
  const list = (names || []).map((n) => String(n).toLowerCase());
  const known = list.find((t) => KNOWN_CATEGORY_TAGS.has(t));
  if (known) return known;
  const valid = list.find(isValidHashtagName);
  return valid || null;
}

function primaryHashtagFromPost(post) {
  const fromDb = (post.hashtags || []).map((ph) => ph.hashtag?.name ?? ph);
  const fromContent =
    post.content && !fromDb.length
      ? extractHashtags(post.content)
      : fromDb.map((n) => String(n).toLowerCase());
  return primaryHashtagFromNames(fromContent) || 'general';
}

module.exports = {
  KNOWN_CATEGORY_TAGS,
  isValidHashtagName,
  isCategoryTag,
  extractHashtags,
  primaryHashtagFromNames,
  primaryHashtagFromPost,
};
