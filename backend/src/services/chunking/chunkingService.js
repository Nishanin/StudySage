const ResourceTextChunkModel = require("../../models/resourceTextChunkModel");
const { splitTextIntoChunks } = require("./textChunker");

const chunkModel = new ResourceTextChunkModel();

async function run({ resourceId, sourceType, items, extracted }) {
  if (!resourceId) {
    throw new Error("resourceId is required");
  }

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

  if (sourceTypeValue !== "pdf" && sourceTypeValue !== "pptx") {
    throw new Error("Unsupported sourceType");
  }

  let chunkIndex = 1;

  for (const item of resolvedItems) {
    const rawText = item.text || "";
    const chunks = splitTextIntoChunks(rawText);

    const chunkTypeValue = sourceTypeValue === "pptx" ? "slide" : "page";

    for (const chunk of chunks) {
      const payload = {
        resource_id: resourceId,
        source_type: sourceTypeValue,
        page_number:
          sourceTypeValue === "pdf" ? item.page_number || null : null,
        slide_number:
          sourceTypeValue === "pptx" ? item.slide_number || null : null,
        start_timestamp: null,
        chunk_index: chunkIndex,
        content: chunk.text,
        token_count: chunk.tokenCount,
        chunk_type: chunkTypeValue,
      };

      const { error } = await chunkModel.insertChunk(payload);
      if (error) {
        throw new Error(error.message);
      }

      chunkIndex += 1;
    }
  }
}

module.exports = {
  run,
};
