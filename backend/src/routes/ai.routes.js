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

/**
 * POST /api/ai/notes
 * Generate structured study notes from PDF/PPT content
 * 
 * Request Body:
 * {
 *   sessionId: "uuid" (required),
 *   resourceId: "uuid" (required),
 *   pageNumber: number (optional),
 *   scope: "page" | "selection" (optional, defaults to "page")
 * }
 * 
 * Logic Flow:
 * 1. Validate sessionId and resourceId (UUID format)
 * 2. Determine note source based on scope:
 *    - "page": Fetch content_chunks for given page_number
 *    - "selection": Use selected_text from study_contexts
 * 3. Query Qdrant for semantically relevant chunks
 * 4. Build deterministic prompt with instruction: "Generate concise study notes"
 * 5. Generate notes using AI/ML service
 * 6. Store in learning_requests table with scope and metadata
 * 7. Return structured notes + key terms + related concepts
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     notesId: uuid,
 *     notes: string (formatted study notes),
 *     summary: string (brief preview),
 *     keyTerms: string[],
 *     relatedConcepts: [{ type, content, relevanceScore }, ...],
 *     metadata: {
 *       resourceId: uuid,
 *       pageNumber: number,
 *       sessionId: uuid,
 *       scope: "page" | "selection",
 *       contextEnrichment: { foundRelatedMemories, insight },
 *       generatedAt: ISO timestamp,
 *       model: string,
 *       wordCount: number,
 *       responseTimeMs: number,
 *       tokensUsed: number
 *     }
 *   }
 * }
 */
router.post('/notes', aiController.notes);

module.exports = router;
