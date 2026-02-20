const { extractPdf } = require("./pdfExtractionService");
const { extractPptx } = require("./pptxExtractionService");
const ResourceFileModel = require("../../models/resourceFileModel");

const resourceFileModel = new ResourceFileModel();
const PPTX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

async function start(resourceId) {
  const { data: file, error } =
    await resourceFileModel.getByResourceId(resourceId);
  if (error) {
    throw new Error(error.message);
  }
  if (!file) {
    throw new Error("File not found");
  }

  let extracted;
  let sourceType;
  let items;

  if (file.mime_type === "application/pdf") {
    extracted = await extractPdf(resourceId);
    sourceType = "pdf";
    items = extracted.pages || [];
  } else if (file.mime_type === PPTX_MIME_TYPE) {
    extracted = await extractPptx(resourceId);
    sourceType = "pptx";
    items = extracted.slides || [];
  } else if ((file.original_file_name || "").toLowerCase().endsWith(".pptx")) {
    extracted = await extractPptx(resourceId);
    sourceType = "pptx";
    items = extracted.slides || [];
  } else {
    throw new Error("Unsupported file type for extraction");
  }

  return { extracted, sourceType, items };
}

module.exports = { start };
