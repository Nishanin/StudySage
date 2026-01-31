const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const ocrController = require('../controllers/ocr.controller');

/**
 * OCR Routes
 * Base: /api/ocr
 */

/**
 * POST /api/ocr/check-and-process
 * Check if PDF is scanned and trigger OCR if needed
 */
router.post('/check-and-process', authenticate, ocrController.checkAndProcessPdf);

/**
 * GET /api/ocr/results/:resourceId
 * Get OCR results for a specific resource
 */
router.get('/results/:resourceId', authenticate, ocrController.getOcrResults);

/**
 * GET /api/ocr/job/:jobId
 * Get OCR job status and progress
 */
router.get('/job/:jobId', authenticate, ocrController.getOcrJobStatus);

/**
 * GET /api/ocr/text/:resourceId
 * Get consolidated OCR text for a document
 */
router.get('/text/:resourceId', authenticate, ocrController.getOcrText);

module.exports = router;
