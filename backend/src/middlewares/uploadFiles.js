const path = require("path");
const fs = require("fs");
const multer = require("multer");

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function getUniqueFilename(dir, baseName, ext) {
  let candidate = `${baseName}${ext}`;
  let counter = 0;

  while (fs.existsSync(path.join(dir, candidate))) {
    counter += 1;
    candidate = `${baseName}${counter}${ext}`;
  }

  return candidate;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { resourceId } = req.params;

    const uploadDir = path.join(__dirname, "..", "..", "uploads", resourceId);

    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLocaleLowerCase();
    cb(null, `original${ext}`);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uploadDir = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      req.params.resourceId,
    );

    const uniqueName = getUniqueFilename(uploadDir, "original", ext);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error("Only PDF and PPT/PPTX files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;
