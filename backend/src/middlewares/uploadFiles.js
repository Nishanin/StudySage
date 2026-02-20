const path = require("path");
const fs = require("fs");
const multer = require("multer");

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function cleanUploadDir(uploadDir) {
  if (!fs.existsSync(uploadDir)) {
    return;
  }

  const entries = fs.readdirSync(uploadDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const filePath = path.join(uploadDir, entry.name);
    fs.unlinkSync(filePath);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { resourceId } = req.params;

    const uploadDir = path.join(__dirname, "..", "..", "uploads", resourceId);

    fs.mkdirSync(uploadDir, { recursive: true });
    cleanUploadDir(uploadDir);
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `original${ext}`);
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
