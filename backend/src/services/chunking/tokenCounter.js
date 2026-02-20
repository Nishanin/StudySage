function estimateTokenCount(text) {
  if (!text) return 0;
  const normalized = text.trim();
  if (!normalized) return 0;
  return Math.max(1, Math.ceil(normalized.length / 4));
}

module.exports = {
  estimateTokenCount,
};
