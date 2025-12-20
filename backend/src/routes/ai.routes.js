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

/**
 * POST /api/ai/flashcards
 * Generate study flashcards from PDF/PPT content
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
 * 2. Determine flashcard source based on scope:
 *    - "page": Generate flashcards from content_chunks for given page_number
 *    - "selection": Generate flashcards from selected_text
 * 3. Query Qdrant for semantically relevant context and concepts
 * 4. Build deterministic prompt with instruction: "Generate effective flashcards"
 * 5. Generate flashcards using AI/ML service
 * 6. Store in learning_requests table with request_type='flashcard'
 * 7. Return structured flashcards + metadata
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     flashcardsId: uuid,
 *     flashcards: [
 *       { question: string, answer: string, difficulty: string, source: string },
 *       ...
 *     ],
 *     totalCards: number,
 *     relatedConcepts: [{ type, content, relevanceScore }, ...],
 *     metadata: {
 *       resourceId: uuid,
 *       pageNumber: number,
 *       sessionId: uuid,
 *       scope: "page" | "selection",
 *       contextEnrichment: { foundRelatedMemories, insight },
 *       generatedAt: ISO timestamp,
 *       model: string,
 *       cardCount: number,
 *       responseTimeMs: number,
 *       tokensUsed: number
 *     }
 *   }
 * }
 */
router.post('/flashcards', aiController.flashcards);

/**
 * POST /api/ai/diagram
 * Generate visual diagrams (mind maps / flow diagrams) from PDF/PPT content
 * 
 * Request Body:
 * {
 *   sessionId: "uuid" (required),
 *   resourceId: "uuid" (required),
 *   pageNumber: number (optional),
 *   scope: "page" | "selection" (optional, defaults to "page"),
 *   diagramType: "mindmap" | "flowchart" (optional, defaults to "mindmap")
 * }
 * 
 * Logic Flow:
 * 1. Validate sessionId and resourceId (UUID format)
 * 2. Validate scope and diagramType enums
 * 3. Determine diagram source based on scope:
 *    - "page": Generate diagram from content_chunks for given page_number
 *    - "selection": Generate diagram from selected_text
 * 4. Query Qdrant for semantically relevant context and concepts
 * 5. Build deterministic prompt with instruction: "Generate a clear {diagramType} using Mermaid syntax"
 * 6. Generate diagram using AI/ML service (returns Mermaid code)
 * 7. Store in learning_requests table with request_type='diagram'
 * 8. Return structured diagram + metadata
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     diagramId: uuid,
 *     diagram: string (Mermaid syntax),
 *     diagramType: "mindmap" | "flowchart",
 *     format: "mermaid",
 *     relatedConcepts: [{ type, content, relevanceScore }, ...],
 *     metadata: {
 *       resourceId: uuid,
 *       pageNumber: number,
 *       sessionId: uuid,
 *       scope: "page" | "selection",
 *       diagramType: "mindmap" | "flowchart",
 *       contextEnrichment: { foundRelatedMemories, insight },
 *       generatedAt: ISO timestamp,
 *       model: string,
 *       format: "mermaid",
 *       responseTimeMs: number,
 *       tokensUsed: number
 *     }
 *   }
 * }
 */
router.post('/diagram', aiController.diagram);

module.exports = router;
