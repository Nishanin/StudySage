const extractionService = require("./extraction/extractionService");

async function start(resourceId) {
  return extractionService.start(resourceId);
}
