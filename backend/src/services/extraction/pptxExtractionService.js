const fs = require("fs");
const path = require("path");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const UPLOADS_ROOT = path.resolve(__dirname, "..", "..", "..", "uploads");

const createError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

async function resolvePptxPath(resourceId) {
  const resourceDir = path.join(UPLOADS_ROOT, resourceId);

  let entries;
  try {
    entries = await fs.promises.readdir(resourceDir, { withFileTypes: true });
  } catch {
    throw createError("Uploaded PPTX not found", 404);
  }

  const pptxFile = entries.find(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pptx"),
  );

  if (!pptxFile) {
    throw createError("Uploaded PPTX not found", 404);
  }

  return path.join(resourceDir, pptxFile.name);
}

async function callMlPptxExtraction(fileBuffer, filename) {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([fileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }),
    filename,
  );

  const response = await fetch(`${ML_SERVICE_URL}/extract/pptx`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createError(
      payload?.detail || "ML PPTX extraction failed",
      response.status,
    );
  }

  return payload;
}

async function extractPptx(resourceId) {
  const filePath = await resolvePptxPath(resourceId);
  const buffer = await fs.promises.readFile(filePath);

  const payload = await callMlPptxExtraction(buffer, path.basename(filePath));

  return {
    type: payload.type || "pptx",
    total_slides:
      payload.total_slides || (payload.slides ? payload.slides.length : 0),
    slides: payload.slides || [],
  };
}

module.exports = { extractPptx };
