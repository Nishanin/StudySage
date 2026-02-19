const ResourceTextChunkModel = require("../../models/resourceTextChunkModel");
const { splitTextIntoChunks } = require("./textChunker");

const chunkModel = new ResourceTextChunkModel();

async function run({ resourceId, sourceType, items, extracted }) {
  if (!resourceId) {
    throw new Error("resourceId is required");
  }

  const normalizeTimestamp = (value) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return Math.round(numeric);
    }
    return null;
  };

  let resolvedSourceType = sourceType;
  let resolvedItems = items;

  if ((!resolvedSourceType || !resolvedItems) && extracted) {
    resolvedSourceType = extracted.type;
    if (resolvedSourceType === "pdf") {
      resolvedItems = extracted.pages || [];
    } else if (resolvedSourceType === "pptx") {
      resolvedItems = extracted.slides || [];
    }
  }

  if (!resolvedSourceType) {
    throw new Error("sourceType is required");
  }

  if (!Array.isArray(resolvedItems)) {
    throw new Error("items are required");
  }

  const sourceTypeValue = resolvedSourceType;

  if (
    sourceTypeValue !== "pdf" &&
    sourceTypeValue !== "pptx" &&
    sourceTypeValue !== "youtube"
  ) {
    throw new Error("Unsupported sourceType");
  }

  let chunkIndex = 1;
  const collectedChunks = [];

  for (const item of resolvedItems) {
    const rawText = item.text || "";
    const chunks = splitTextIntoChunks(rawText);

    const chunkTypeValue =
      sourceTypeValue === "pptx"
        ? "slide"
        : sourceTypeValue === "youtube"
          ? "timestamp"
          : "page";

    for (const chunk of chunks) {
      const payload = {
        resource_id: resourceId,
        source_type: sourceTypeValue,
        page_number:
          sourceTypeValue === "pdf" ? item.page_number || null : null,
        slide_number:
          sourceTypeValue === "pptx" ? item.slide_number || null : null,
        start_timestamp:
          sourceTypeValue === "youtube" ? normalizeTimestamp(item.start) : null,
        chunk_index: chunkIndex,
        content: chunk.text,
        token_count: chunk.tokenCount,
        chunk_type: chunkTypeValue,
      };

      const { error } = await chunkModel.insertChunk(payload);
      if (error) {
        throw new Error(error.message);
      }

      collectedChunks.push({
        text: chunk.text,
        page_number: payload.page_number,
        slide_number: payload.slide_number,
        timestamp: payload.start_timestamp,
      });

      chunkIndex += 1;

      return collectedChunks;
    }
  }
}

module.exports = {
  run,
};
