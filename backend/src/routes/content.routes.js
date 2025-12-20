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

/**
 * GET /content/sections
 * Get all study sections for current user
 * Ordered by confidence score (highest first)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     sections: [
 *       {
 *         id: uuid,
 *         title: string,
 *         description: string,
 *         confidenceScore: number,
 *         mlMetadata: object,
 *         createdAt: ISO timestamp,
 *         updatedAt: ISO timestamp
 *       }
 *     ]
 *   }
 * }
 */
router.get('/sections', authenticate, contentController.getSections);

/**
 * GET /content/sections/:sectionId/resources
 * Get all resources in a specific section
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     resources: [
 *       {
 *         id: uuid,
 *         title: string,
 *         resourceType: 'pdf'|'ppt'|'audio'|'youtube',
 *         fileUrl: string (for file resources),
 *         youtubeVideoId: string (for youtube),
 *         processingStatus: 'pending'|'completed'|'failed',
 *         createdAt: ISO timestamp
 *       }
 *     ]
 *   }
 * }
 */
router.get('/sections/:sectionId/resources', authenticate, contentController.getSectionResources);

/**
 * GET /content/resources
 * Get all resources for current user
 * Includes section association
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     resources: [
 *       {
 *         id: uuid,
 *         sectionId: uuid,
 *         sectionTitle: string,
 *         title: string,
 *         resourceType: 'pdf'|'ppt'|'audio'|'youtube',
 *         processingStatus: 'pending'|'completed'|'failed',
 *         createdAt: ISO timestamp
 *       }
 *     ]
 *   }
 * }
 */
router.get('/resources', authenticate, contentController.getUserResources);

/**
 * GET /content/download/:resourceId
 * Download/stream a resource file by ID
 * User must own the resource
 * 
 * Response: Binary file data (PDF, PPT, or audio)
 */
router.get('/download/:resourceId', authenticate, contentController.downloadFile);

/**
 * POST /content/convert-to-pdf/:resourceId
 * Convert PowerPoint file to PDF
 * User must own the resource
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     pdfPath: string,
 *     converted: boolean,
 *     fileSize: number
 *   }
 * }
 */
router.post('/convert-to-pdf/:resourceId', authenticate, contentController.convertToPdf);

/**
 * GET /content/highlights/:resourceId?page=pageNumber
 * Get all highlights for a specific page of a document
 * 
 * Query Parameters:
 * - page (required): Page number to get highlights for
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     highlights: [
 *       {
 *         id: string,
 *         text: string,
 *         color: string,
 *         opacity: number,
 *         found: boolean
 *       }
 *     ],
 *     pageNumber: number,
 *     count: number
 *   }
 * }
 */
router.get('/highlights/:resourceId', authenticate, contentController.getHighlights);

/**
 * POST /content/highlights/:resourceId
 * Add a new highlight to a document page
 * 
 * Body:
 * {
 *   pageNumber: number (required),
 *   text: string (required),
 *   color: string (optional, default: 'yellow'),
 *   opacity: number (optional, default: 0.4)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     id: string,
 *     text: string,
 *     color: string,
 *     opacity: number
 *   }
 * }
 */
router.post('/highlights/:resourceId', authenticate, contentController.addHighlight);

/**
 * DELETE /content/highlights/:resourceId/:highlightId
 * Delete a specific highlight
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string
 * }
 */
router.delete('/highlights/:resourceId/:highlightId', authenticate, contentController.deleteHighlight);

module.exports = router;
