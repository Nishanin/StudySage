const express = require('express');
const router = express.Router();
const multer = require('multer');
const contentController = require('../controllers/content.controller');
const { authenticate } = require('../middlewares/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'audio/mpeg',
      'audio/wav',
      'audio/m4a'
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.match(/\.(pdf|pptx?|mp3|wav|m4a)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, PPT, MP3, WAV'));
    }
  }
});

// Protected routes (require authentication)

/**
 * POST /content/upload
 * Upload file content (PDF, PPT, Audio)
 * 
 * Request:
 * - Form data with file and optional title
 * - file: multipart file (pdf, pptx, mp3, wav)
 * - title: optional string
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     resourceId: uuid,
 *     title: string,
 *     resourceType: 'pdf'|'ppt'|'audio',
 *     section: { id: uuid, title: string },
 *     processingStatus: 'pending',
 *     subjects: string[],
 *     sections: {title: string, confidence: number}[],
 *     createdAt: ISO timestamp
 *   }
 * }
 */
router.post('/upload', authenticate, upload.single('file'), contentController.uploadFile);

/**
 * POST /content/youtube
 * Add YouTube video content
 * 
 * Request Body:
 * {
 *   videoId: "string" (11-char YouTube video ID),
 *   title: "string" (optional)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     resourceId: uuid,
 *     title: string,
 *     resourceType: 'youtube',
 *     videoId: string,
 *     thumbnailUrl: string,
 *     duration: number (seconds),
 *     section: { id: uuid, title: string },
 *     processingStatus: 'pending',
 *     subjects: string[],
 *     sections: {title: string, confidence: number}[],
 *     createdAt: ISO timestamp
 *   }
 * }
 */
router.post('/youtube', authenticate, contentController.addYouTubeContent);

module.exports = router;
