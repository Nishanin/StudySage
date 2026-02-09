const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const libre = require("libreoffice-convert");
const util = require("util");

const ResourceModel = require("../models/resourceModel");
const ResourceFileModel = require("../models/resourceFileModel");
const pipelineService = require("../services/pipelineService");

const resourceFileModel = new ResourceFileModel();
const resourceModel = new ResourceModel();

const convertToPdf = util.promisify(libre.convert);

async function loadPdfBuffer(filePath, mimeType) {
  const lowerPath = filePath.toLowerCase();
  const isPdf = mimeType === "application/pdf" || lowerPath.endsWith(".pdf");
  if (isPdf) {
    return fs.promises.readFile(filePath);
  }

  const isPptx =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    lowerPath.endsWith(".pptx") ||
    lowerPath.endsWith(".ppt");

  if (!isPptx) {
    throw new Error("Unsupported file type for paged view");
  }

  const inputBuffer = await fs.promises.readFile(filePath);
  return convertToPdf(inputBuffer, ".pdf", undefined);
}

async function uploadResourceFile(req, res) {
  const { resourceId } = req.params;

  if (!resourceId) {
    return res.status(400).json({
      success: false,
      error: { message: "resourceId is required" },
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: "File is required" },
    });
  }

  const { data: resource, error: resourceError } =
    await resourceModel.getById(resourceId);

  if (resourceError) {
    return res.status(500).json({
      success: false,
      error: { message: resourceError.message },
    });
  }

  if (!resource) {
    return res.status(404).json({
      success: false,
      error: { message: "Resource not found" },
    });
  }

  const filePayload = {
    resource_id: resourceId,
    storage_type: "local",
    local_path: req.file.path,
    original_file_name: req.file.originalname,
    mime_type: req.file.mimetype,
    file_size_bytes: req.file.size,
  };

  const { data, error } = await resourceFileModel.create(filePayload);

  if (error) {
    return res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }

  const ext = path.extname(req.file.originalname || "").toLowerCase();
  const isPdf = req.file.mimetype === "application/pdf" || ext === ".pdf";
  const isPptx =
    req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    req.file.mimetype === "application/vnd.ms-powerpoint" ||
    ext === ".pptx" ||
    ext === ".ppt";
  if (isPdf || isPptx) {
    pipelineService.start(resourceId).catch((pipelineError) => {
      console.error("Extraction pipeline failed", pipelineError);
    });
  }

  return res.status(201).json({
    success: true,
    data: data,
    message: "File uploaded. Processing started.",
  });
}

async function getResourceFile(req, res) {
  const { resourceId } = req.params;

  if (!resourceId) {
    return res.status(400).json({
      success: false,
      error: { message: "resourceId is required" },
    });
  }

  const { data, error } =
    await resourceFileModel.getFileByResourceId(resourceId);

  if (error) {
    return res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }

  return res.status(200).json({
    success: true,
    data: data,
  });
}

// async function viewResourceFile(req, res) {
//   const { resourceId } = req.params;
//   const startPageParam = Number.parseInt(req.query.page, 10) || 1;
//   const loadCountParam = Number.parseInt(req.query.loaded, 10) || 10;

//   const { data: file, error } =
//     await resourceFileModel.getByResourceId(resourceId);
//   if (error) {
//     return res.status(500).json({ message: error.message });
//   }
//   if (!file) {
//     return res.status(404).json({ message: "File not found" });
//   }

//   const filePath = path.resolve(file.local_path);

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ message: "File missing on server" });
//   }

//   let pdfBuffer;
//   try {
//     pdfBuffer = await loadPdfBuffer(filePath, file.mime_type);
//   } catch (err) {
//     return res.status(415).json({ message: err.message });
//   }

//   const pdfDoc = await PDFDocument.load(pdfBuffer);
//   const totalPages = pdfDoc.getPageCount();

//   const startPage = Math.max(1, startPageParam);
//   const sanitizedLoad = Math.max(1, loadCountParam);
//   const maxLoad = totalPages > 10 ? (startPage === 1 ? 10 : 5) : totalPages;
//   const loadCount = Math.min(sanitizedLoad, maxLoad);
//   const endPage = Math.min(startPage + loadCount - 1, totalPages);

//   if (startPage > totalPages) {
//     return res.status(204).end();
//   }

//   if (startPage > endPage) {
//     return res.status(204).end();
//   }

//   const pageIndices = [];
//   for (let page = startPage; page <= endPage; page += 1) {
//     pageIndices.push(page - 1);
//   }

//   const outputDoc = await PDFDocument.create();
//   const copiedPages = await outputDoc.copyPages(pdfDoc, pageIndices);
//   copiedPages.forEach((page) => outputDoc.addPage(page));

//   const outputBytes = await outputDoc.save();

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader("Content-Disposition", "inline");
//   res.setHeader("X-Total-Pages", totalPages.toString());
//   res.setHeader("X-Page-Start", startPage.toString());
//   res.setHeader("X-Page-End", endPage.toString());

//   return res.status(200).send(Buffer.from(outputBytes));
// }

async function viewResourceFile(req, res) {
  const { resourceId } = req.params;

  const { data: file, error } =
    await resourceFileModel.getByResourceId(resourceId);
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  const filePath = path.resolve(file.local_path);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File missing on server" });
  }

  let pdfBuffer;
  try {
    pdfBuffer = await loadPdfBuffer(filePath, file.mime_type);
  } catch (err) {
    return res.status(415).json({ message: err.message });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");

  return res.status(200).send(Buffer.from(pdfBuffer));
}

module.exports = {
  uploadResourceFile,
  getResourceFile,
  viewResourceFile,
};
