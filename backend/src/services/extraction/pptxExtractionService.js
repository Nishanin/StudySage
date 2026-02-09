const fs = require("fs");
const path = require("path");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const UPLOADS_ROOT = path.resolve(__dirname, "..", "..", "..", "uploads");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

async function resolvePptPath(resourceId) {
  const resourceDir = path.join(UPLOADS_ROOT, resourceId);
  const defaultPptx = path.join(resourceDir, "original.pptx");

  if (fs.existsSync(defaultPptx)) {
    return defaultPptx;
  }

  let entries;
  try {
    entries = await fs.promises.readdir(resourceDir, { withFileTypes: true });
  } catch (error) {
    throw createError("Uploaded file not found", 404);
  }

  const pptCandidates = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^original.*\.pptx$/i.test(name))
    .sort();

  if (pptCandidates.length === 0) {
    throw createError("Uploaded file not found", 404);
  }

  return path.join(resourceDir, pptCandidates[0]);
}

function getPptMimeType() {
  return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
}

async function callMlPptExtraction(fileBuffer, originalName, mimeType) {
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append("file", blob, originalName || "slides.pptx");

  let response;
  try {
    response = await fetch(new URL("/extract/ppt", ML_SERVICE_URL), {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw createError("Failed to reach ML extraction service", 502);
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    throw createError(
      payload?.detail || payload?.message || "ML extraction failed",
      response.status,
    );
  }

  return payload;
}

async function extractPpt(resourceId) {
  if (!resourceId) {
    throw createError("resourceId is required", 400);
  }

  const filePath = await resolvePptPath(resourceId);
  const fileBuffer = await fs.promises.readFile(filePath);
  const payload = await callMlPptExtraction(
    fileBuffer,
    path.basename(filePath),
    getPptMimeType(filePath),
  );

  return {
    slides: payload.slides || [],
    total_slides:
      payload.total_slides || (payload.slides ? payload.slides.length : 0),
    type: payload.type || "ppt",
  };
}

module.exports = {
  extractPpt,
};
