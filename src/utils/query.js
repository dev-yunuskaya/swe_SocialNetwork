function parseExcludeIds(raw) {
  if (Array.isArray(raw)) {
    return raw
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
      .slice(0, 800);
  }
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 800);
}

module.exports = { parseExcludeIds };
