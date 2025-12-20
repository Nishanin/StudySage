const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middlewares/auth');

// All AI routes require authentication
router.use(authenticate);

/**
 * POST /api/ai/explain
 * Generate context-aware AI explanation for selected text or page content
 * 
 * Request Body:
 * {
 *   sessionId: "uuid" (required),
 *   resourceId: "uuid" (required),
 *   pageNumber: number (optional),
 *   selectedText: string (optional),
 *   task: "explain" (optional, defaults to "explain")
 * }
 * 
 * Logic Flow:
 * 1. Use selectedText if provided, otherwise fetch page content
 * 2. Query Qdrant for related memories with user/session/resource filters
 * 3. Build enriched prompt with primary text + related context
 * 4. Generate explanation (mock LLM for now)
 * 5. Extract highlight snippets
 * 6. Store in database (chat_messages table)
 * 7. Return explanation + highlights + related concepts
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     explanationId: uuid,
 *     explanation: string,
 *     highlights: [{ text, reason }, ...],
 *     relatedConcepts: [{ type, content, relevanceScore }, ...],
 *     metadata: {
 *       resourceId: uuid,
 *       pageNumber: number,
 *       sessionId: uuid,
 *       contextEnrichment: { foundRelatedMemories, insight },
 *       generatedAt: ISO timestamp,
 *       model: string,
 *       responseTimeMs: number,
 *       tokensUsed: number
 *     }
 *   }
 * }
 */
router.post('/explain', aiController.explain);

module.exports = router;
