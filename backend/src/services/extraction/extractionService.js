const { extractPdfByResourceId } = require("./pdfExtractionService");
const { extractPpt } = require("./pptxExtractionService");
const resourceFileModel = require("../../models/resourceFileModel");

async function start(resourceId) {
  const { data: file } = await resourceFileModel.getByResourceId(resourceId);
  if (!file) throw new Error("File not found");

  if (file.mime_type === "application/pdf") {
    return extractPdfByResourceId(resourceId);
  }

  if (
    file.mime_type.includes("presentation") ||
    file.mime_type.includes("powerpoint")
  ) {
    return extractPpt(resourceId);
  }

  throw new Error("Unsupported file type for extraction");
}

module.exports = { start };
