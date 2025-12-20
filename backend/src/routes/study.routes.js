const express = require('express');
const router = express.Router();
const studyController = require('../controllers/study.controller');
const { authenticate } = require('../middlewares/auth');

// All study routes require authentication
router.use(authenticate);

/**
 * POST /study/context
 * Sync user's current study context with session data
 * 
 * Request Body:
 * {
 *   sessionId: "uuid" (required),
 *   resourceId: "uuid" (required),
 *   pageNumber: number (optional),
 *   visibleText: string (optional),
 *   selectedText: string (optional)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     contextId: uuid,
 *     sessionId: uuid,
 *     resourceId: uuid,
 *     pageNumber: number,
 *     visibleText: string,
 *     selectedText: string,
 *     lastUpdated: ISO timestamp
 *   }
 * }
 */
router.post('/context', studyController.syncStudyContext);

module.exports = router;
