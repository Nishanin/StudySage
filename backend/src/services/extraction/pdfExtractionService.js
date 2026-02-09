const fs = require("fs");
const path = require("path");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const UPLOADS_ROOT = path.resolve(__dirname, "..", "..", "..", "uploads");

const createError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

async function resolvePdfPath(resourceId) {
  const resourceDir = path.join(UPLOADS_ROOT, resourceId);

  let entries;
  try {
    entries = await fs.promises.readdir(resourceDir, { withFileTypes: true });
  } catch {
    throw createError("Uploaded PDF not found", 404);
  }

  const pdf = entries.find(
    (e) => e.isFile() && e.name.toLowerCase().endsWith(".pdf"),
  );

  if (!pdf) {
    throw createError("Uploaded PDF not found", 404);
  }

  return path.join(resourceDir, pdf.name);
}

async function callMlPdfExtraction(fileBuffer, filename) {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([fileBuffer], { type: "application/pdf" }),
    filename,
  );

  const response = await fetch(`${ML_SERVICE_URL}/extract/pdf`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createError(
      payload?.detail || "ML PDF extraction failed",
      response.status,
    );
  }

  return payload;
}

async function extractPdf(resourceId) {
  const filePath = await resolvePdfPath(resourceId);
  const buffer = await fs.promises.readFile(filePath);

  return callMlPdfExtraction(buffer, path.basename(filePath));
}

module.exports = { extractPdf };
