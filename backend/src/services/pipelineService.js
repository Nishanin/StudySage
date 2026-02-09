const extractionService = require("./extraction/extractionService");
const chunkingService = require("./chunking/chunkingService");

async function start(resourceId) {
  const result = await extractionService.start(resourceId);
  await chunkingService.run({
    resourceId,
    sourceType: result.sourceType,
    items: result.items,
  });
  return result;
}

module.exports = {
  start,
};
