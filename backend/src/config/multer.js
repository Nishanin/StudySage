const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`📁 Created upload directory: ${UPLOAD_DIR}`);
}

// File size limits (in bytes)
const MAX_FILE_SIZE = {
  pdf: 50 * 1024 * 1024,      // 50 MB for PDFs
  ppt: 100 * 1024 * 1024,     // 100 MB for presentations
  audio: 200 * 1024 * 1024    // 200 MB for audio
};

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  pdf: ['application/pdf'],
  ppt: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  audio: [
    'audio/mpeg',        // mp3
    'audio/wav',         // wav
    'audio/mp4',         // m4a
    'audio/x-m4a',       // m4a
    'audio/ogg',         // ogg
    'audio/webm'         // webm
  ]
};

// File extensions
const ALLOWED_EXTENSIONS = {
  pdf: ['.pdf'],
  ppt: ['.ppt', '.pptx'],
  audio: ['.mp3', '.wav', '.m4a', '.ogg', '.webm']
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create date-based subdirectory
    const dateFolder = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uploadPath = path.join(UPLOAD_DIR, dateFolder);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-uuid-originalname
    const timestamp = Date.now();
    const uuid = require('uuid').v4().substring(0, 8);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Sanitize filename
      .substring(0, 50); // Limit length
    
    cb(null, `${timestamp}-${uuid}-${basename}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();
  
  // Determine file category
  let category = null;
  let isValid = false;
  
  if (ALLOWED_MIME_TYPES.pdf.includes(mimeType) || ALLOWED_EXTENSIONS.pdf.includes(ext)) {
    category = 'pdf';
    isValid = true;
  } else if (ALLOWED_MIME_TYPES.ppt.includes(mimeType) || ALLOWED_EXTENSIONS.ppt.includes(ext)) {
    category = 'ppt';
    isValid = true;
  } else if (ALLOWED_MIME_TYPES.audio.includes(mimeType) || ALLOWED_EXTENSIONS.audio.includes(ext)) {
    category = 'audio';
    isValid = true;
  }
  
  if (!isValid) {
    return cb(
      new Error(
        `Invalid file type. Allowed: PDF (.pdf), PowerPoint (.ppt, .pptx), Audio (.mp3, .wav, .m4a, .ogg)`
      ),
      false
    );
  }
  
  // Attach category to file object for later validation
  file.category = category;
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(MAX_FILE_SIZE)) // Use largest limit, validate per-category later
  }
});

const validateFileSize = (file) => {
  if (!file.category) {
    throw new Error('File category not determined');
  }
  
  const maxSize = MAX_FILE_SIZE[file.category];
  if (file.size > maxSize) {
    // Delete uploaded file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    throw new Error(
      `File too large. Maximum size for ${file.category.toUpperCase()}: ${(maxSize / 1024 / 1024).toFixed(0)} MB`
    );
  }
  
  return true;
};

const getFileUrl = (filePath) => {
  const relativePath = path.relative(UPLOAD_DIR, filePath);
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  // Convert Windows backslashes to URL forward slashes
  const urlPath = relativePath.split(path.sep).join('/');
  return `${baseUrl}/uploads/${urlPath}`;
};

module.exports = {
  upload,
  validateFileSize,
  getFileUrl,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS
};
