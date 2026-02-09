const { estimateTokenCount } = require("./tokenCounter");

function splitTextIntoChunks(text, maxTokens = 400, overlapTokens = 50) {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const safeMaxTokens = Math.max(1, Number(maxTokens) || 1);
  let safeOverlapTokens = Math.max(0, Number(overlapTokens) || 0);
  if (safeOverlapTokens >= safeMaxTokens) {
    safeOverlapTokens = Math.max(0, safeMaxTokens - 1);
  }

  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks = [];
  let current = "";
  let currentTokens = 0;
  let chunkIndex = 1;

  const getOverlapText = (value) => {
    if (!safeOverlapTokens || !value) return "";

    const words = value.split(/\s+/).filter(Boolean);
    if (!words.length) return "";

    let buffer = [];
    for (let i = words.length - 1; i >= 0; i -= 1) {
      const candidate = [words[i], ...buffer].join(" ");
      const candidateTokens = estimateTokenCount(candidate);
      if (candidateTokens > safeOverlapTokens) {
        if (!buffer.length) {
          const maxChars = safeOverlapTokens * 4;
          return maxChars > 0 ? words[i].slice(-maxChars) : "";
        }
        break;
      }
      buffer.unshift(words[i]);
    }

    return buffer.join(" ");
  };

  const pushCurrent = (withOverlap = true) => {
    if (!current) return;

    const tokenCount = estimateTokenCount(current);
    chunks.push({
      text: current,
      index: chunkIndex,
      tokenCount,
    });
    chunkIndex += 1;

    if (withOverlap) {
      current = getOverlapText(current);
      currentTokens = estimateTokenCount(current);
    } else {
      current = "";
      currentTokens = 0;
    }
  };

  const splitOversizedText = (value) => {
    const maxChars = safeMaxTokens * 4;
    for (let start = 0; start < value.length; start += maxChars) {
      const slice = value.slice(start, start + maxChars);
      tryAdd(slice);
    }
  };

  const tryAdd = (piece) => {
    const pieceTokens = estimateTokenCount(piece);
    if (pieceTokens > safeMaxTokens) {
      splitOversizedText(piece);
      return;
    }

    if (currentTokens === 0) {
      current = piece;
      currentTokens = pieceTokens;
      return;
    }

    const combined = `${current}\n\n${piece}`;
    const combinedTokens = estimateTokenCount(combined);
    if (combinedTokens <= safeMaxTokens) {
      current = combined;
      currentTokens = combinedTokens;
      return;
    }

    pushCurrent();
    current = piece;
    currentTokens = pieceTokens;
  };

  const splitLongSentenceByWords = (sentence) => {
    const words = sentence.split(/\s+/).filter(Boolean);
    let buffer = [];

    for (const word of words) {
      const candidate = buffer.length ? `${buffer.join(" ")} ${word}` : word;
      if (estimateTokenCount(candidate) <= safeMaxTokens) {
        buffer.push(word);
        continue;
      }

      if (buffer.length) {
        tryAdd(buffer.join(" "));
        buffer = [word];
        continue;
      }

      if (estimateTokenCount(word) > safeMaxTokens) {
        splitOversizedText(word);
      } else {
        tryAdd(word);
      }
    }

    if (buffer.length) {
      tryAdd(buffer.join(" "));
    }
  };

  for (const paragraph of paragraphs) {
    if (estimateTokenCount(paragraph) <= safeMaxTokens) {
      tryAdd(paragraph);
      continue;
    }

    const sentenceText = paragraph.replace(/\n+/g, " ").trim();
    const sentences = sentenceText
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    if (!sentences.length) {
      splitLongSentenceByWords(sentenceText);
      continue;
    }

    for (const sentence of sentences) {
      if (estimateTokenCount(sentence) <= safeMaxTokens) {
        tryAdd(sentence);
      } else {
        splitLongSentenceByWords(sentence);
      }
    }
  }

  pushCurrent(false);
  return chunks;
}

module.exports = {
  splitTextIntoChunks,
};
