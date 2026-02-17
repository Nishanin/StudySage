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

  runBackgroundTasks(resourceId, chunks);

  return result;
}

async function runBackgroundTasks(resourceId, chunks) {
  (async () => {
    try {
      await notesService.generateNotes(resourceId);
      console.log(
        `[pipelineService] Notes generation triggered for ${resourceId}`,
      );
    } catch (err) {
      console.error(
        `[pipelineService] Notes generation failed: ${err.message}`,
      );
    }
  })();

  (async () => {
    try {
      const resourceModel = new ResourceModel();
      const { data: resource } = await resourceModel.getById(resourceId);

      if (
        !resource?.workspace_id ||
        !Array.isArray(chunks) ||
        chunks.length === 0
      )
        return;

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
  })();
}

module.exports = { start };
