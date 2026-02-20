const extractionService = require("./extraction/extractionService");
const chunkingService = require("./chunking/chunkingService");
const notesService = require("./notesService");
const { upsertChunks } = require("../vector/upsertChunks");
const ResourceModel = require("../models/resourceModel");

async function start(resourceId) {
  const result = await extractionService.start(resourceId);

  const chunks = await chunkingService.run({
    resourceId,
    sourceType: result.sourceType,
    items: result.items,
  });

  if (Array.isArray(chunks) && chunks.length > 0) {
    runVectorEmbedding(resourceId, chunks);
  } else {
    console.warn(
      `[pipelineService] Skipping vector embedding: chunks not available for resourceId=${resourceId}`,
    );
  }

  runNotesGeneration(resourceId);

  return result;
}

async function runNotesGeneration(resourceId) {
  try {
    await notesService.generateNotes(resourceId);
    console.log(
      `[pipelineService] Notes generation triggered for ${resourceId}`,
    );
  } catch (err) {
    console.error(`[pipelineService] Notes generation failed: ${err.message}`);
  }
}

async function runVectorEmbedding(resourceId, chunks) {
  try {
    const resourceModel = new ResourceModel();
    const { data: resource } = await resourceModel.getById(resourceId);

    if (!resource?.workspace_id) {
      console.warn(
        `[pipelineService] Skipping vector upsert: resource.workspace_id missing for resourceId=${resourceId}`,
      );
      return;
    }
    if (!Array.isArray(chunks)) {
      console.warn(
        `[pipelineService] Skipping vector upsert: chunks is not an array for resourceId=${resourceId}`,
      );
      return;
    }
    if (chunks.length === 0) {
      console.warn(
        `[pipelineService] Skipping vector upsert: chunks is empty for resourceId=${resourceId}`,
      );
      return;
    }

    const content_type =
      resource.type === "video"
        ? "youtube"
        : resource.type === "live_lecture"
          ? "live_lecture"
          : "document";

    console.log("Indexing chunks in vector DB...");

    await upsertChunks({
      workspace_id: resource.workspace_id,
      resource_id: resourceId,
      content_type,
      chunks: chunks.map((chunk) => ({
        text: chunk.text || chunk.content || "",
        page_number: chunk.page_number ?? undefined,
        slide_number: chunk.slide_number ?? undefined,
        timestamp: chunk.timestamp ?? chunk.start_timestamp ?? undefined,
      })),
    });

    console.log("Vector indexing completed");
  } catch (err) {
    console.error(
      "[pipelineService] Vector indexing failed:",
      err.message || err,
    );
  }
}

// runBackgroundTasks is now obsolete and not used

module.exports = { start };
