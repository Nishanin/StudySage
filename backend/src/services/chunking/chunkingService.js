const ResourceTextChunkModel = require("../../models/resourceTextChunkModel");
const { splitTextIntoChunks } = require("./textChunker");

const chunkModel = new ResourceTextChunkModel();

async function chunkExtractedText({ resourceId, extracted }) {
  if (!resourceId) {
    throw new Error("resourceId is required");
  }

  if (!extracted || !extracted.type) {
    throw new Error("extracted.type is required");
  }

  const sourceType = extracted.type;
  let items = [];

  if (sourceType === "pdf") {
    items = extracted.pages || [];
  } else if (sourceType === "ppt") {
    items = extracted.slides || [];
  } else {
    throw new Error("Unsupported extracted.type");
  }

  for (const item of items) {
    const rawText = item.text || "";
    const chunks = splitTextIntoChunks(rawText);

    for (const chunk of chunks) {
      const payload = {
        resource_id: resourceId,
        source_type: sourceType,
        page_number: sourceType === "pdf" ? item.page_number || null : null,
        slide_number: sourceType === "ppt" ? item.slide_number || null : null,
        start_timestamp: null,
        chunk_index: chunk.index,
        content: chunk.text,
        token_count: chunk.tokenCount,
      };

      const { error } = await chunkModel.insertChunk(payload);
      if (error) {
        throw new Error(error.message);
      }
    }
  }
}

module.exports = {
  chunkExtractedText,
};
