const { v4: uuidv4 } = require("uuid");
const client = require("./qdrant");
const { getEmbedding } = require("../services/chatbot/embeddingService");

async function upsertChunks({
  workspace_id,
  resource_id,
  content_type,
  chunks,
}) {
  if (
    !Array.isArray(chunks) ||
    !workspace_id ||
    !resource_id ||
    !content_type
  ) {
    throw new Error("Invalid arguments");
  }
  const collectionName = "study_chunks";
  const batchSize = 20;
  let batch = [];
  let processed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk.text || !chunk.text.trim()) {
      console.log(`[upsertChunks] Skipping empty chunk at index ${i}`);
      continue;
    }
    let embedding;
    try {
      embedding = await getEmbedding(chunk.text);
    } catch (err) {
      throw new Error(
        "Embedding generation failed for chunk: " +
          (chunk.text.slice(0, 30) || ""),
      );
    }

    if (!embedding) {
      console.log(`[upsertChunks] No embedding returned for chunk ${i}`);
      continue;
    }

    const point = {
      id: uuidv4(),
      vector: embedding,
      payload: {
        workspace_id,
        resource_id,
        content_type,
        page_number: chunk.page_number ?? null,
        slide_number: chunk.slide_number ?? null,
        timestamp: chunk.timestamp ?? null,
        text: chunk.text,
      },
    };
    batch.push(point);
    processed++;
    if (batch.length === batchSize) {
      try {
        await client.upsert(collectionName, { points: batch });
      } catch (err) {
        throw new Error("Qdrant upsert failed: " + (err.message || err));
      }
      batch = [];
    }
  }

  if (batch.length > 0) {
    try {
      await client.upsert(collectionName, { points: batch });
    } catch (err) {
      throw new Error("Qdrant upsert failed: " + (err.message || err));
    }
    console.log(`Upserted ${processed} chunks...`);
  }
}

module.exports = { upsertChunks };
