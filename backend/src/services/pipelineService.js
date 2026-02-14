const extractionService = require("./extraction/extractionService");
const chunkingService = require("./chunking/chunkingService");
const notesService = require("./notesService");

async function start(resourceId) {
  const result = await extractionService.start(resourceId);
  await chunkingService.run({
    resourceId,
    sourceType: result.sourceType,
    items: result.items,
  });

  // Trigger notes generation after chunking
  try {
    await notesService.generateNotes(resourceId);
    console.log(
      `[pipelineService] Notes generation triggered for resource ${resourceId}`,
    );
  } catch (err) {
    console.error(
      `[pipelineService] Notes generation failed for resource ${resourceId}: ${err.message}`,
    );
  }

  return result;
}

module.exports = {
  start,
};
