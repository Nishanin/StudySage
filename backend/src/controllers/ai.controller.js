const asyncHandler = require('../middlewares/asyncHandler');
const AIService = require('../services/ai.service');

/**
 * POST /api/ai/explain
 * Generate context-aware AI explanation for selected text or page content
 * 
 * Enriches context with:
 * - Selected text or page content (primary)
 * - Related memories from Qdrant (secondary context)
 * - Session and resource metadata
 */
const explain = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId, resourceId, pageNumber, selectedText, task } = req.body;

  // Validate required fields
  if (!sessionId || !resourceId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'sessionId and resourceId are required',
        statusCode: 400
      }
    });
  }

  // Validate UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId) || !uuidRegex.test(resourceId)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'sessionId and resourceId must be valid UUIDs',
        statusCode: 400
      }
    });
  }

  // Validate page number if provided
  if (pageNumber !== undefined && (typeof pageNumber !== 'number' || pageNumber < 1)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'pageNumber must be a positive number',
        statusCode: 400
      }
    });
  }

  // Ensure task is "explain" (extensible for future tasks)
  if (task && task !== 'explain') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'task must be "explain"',
        statusCode: 400
      }
    });
  }

  try {
    // Step 1: Determine primary text (selected > page content)
    let primaryText = selectedText;
    if (!primaryText && pageNumber) {
      const pageData = await AIService.fetchPageContent(resourceId, pageNumber);
      primaryText = pageData.content;
    }

    if (!primaryText) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Either selectedText or pageNumber is required',
          statusCode: 400
        }
      });
    }

    // Step 2: Enrich context with related memories from Qdrant
    const enrichment = await AIService.enrichContextWithMemories(
      userId,
      sessionId,
      resourceId,
      primaryText,
      5 // Limit to 5 related memories
    );

    // Step 3: Get page content if not already fetched
    let pageContent = primaryText;
    if (selectedText && pageNumber) {
      const pageData = await AIService.fetchPageContent(resourceId, pageNumber);
      pageContent = pageData.content;
    }

    // If no pageNumber but we have selectedText, fetch current page content for mapping
    if (!pageNumber && selectedText) {
      // Default to page 1 for highlight mapping if page not specified
      const pageData = await AIService.fetchPageContent(resourceId, 1);
      pageContent = pageData.content;
    }

    // Step 4: Build structured prompt
    const prompt = AIService.buildExplanationPrompt({
      selectedText,
      pageContent,
      relatedMemories: enrichment.relatedMemories,
      resourceId,
      pageNumber: pageNumber || null,
      sessionId
    });

    // Step 5: Generate explanation (mock LLM for now)
    const response = await Promise.resolve(AIService.generateMockExplanation(prompt));

    // Step 5b: Deterministically map highlights to content chunks
    // Ensures reproducibility: same content = same highlight positions
    const mappedHighlights = AIService.mapHighlightsToContent(
      response.rawHighlights,
      pageContent,
      resourceId,
      pageNumber || 1 // Default to page 1 if not specified
    );

    // Step 6: Store explanation in database
    const stored = await AIService.storeExplanation(
      userId,
      sessionId,
      resourceId,
      pageNumber || null,
      prompt,
      response
    );

    // Step 7: Return explanation and highlights to frontend
    res.status(200).json({
      success: true,
      data: {
        explanationId: stored?.id || null,
        explanation: response.explanation,
        highlights: mappedHighlights, // Now includes pageNumber, resourceId, position, found flag
        relatedConcepts: enrichment.relatedMemories.map(m => ({
          type: m.type,
          content: m.content,
          relevanceScore: m.score
        })),
        metadata: {
          resourceId,
          pageNumber: pageNumber || null,
          sessionId,
          highlightStats: {
            total: mappedHighlights.length,
            matched: mappedHighlights.filter(h => h.found).length,
            unmapped: mappedHighlights.filter(h => !h.found).length
          },
          contextEnrichment: {
            foundRelatedMemories: enrichment.relatedMemories.length,
            insight: enrichment.contextualInsights
          },
          generatedAt: new Date().toISOString(),
          model: response.model,
          responseTimeMs: response.responseTimeMs,
          tokensUsed: response.tokensUsed
        }
      }
    });
  } catch (error) {
    console.error('AI explanation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate explanation',
        statusCode: 500
      }
    });
  }
});

/**
 * POST /api/ai/notes
 * Generate structured study notes from PDF/PPT content
 * 
 * Inputs:
 * - session_id (required)
 * - resource_id (required)
 * - page_number (optional)
 * - scope ("page" or "selection", defaults to "page")
 */
const notes = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId, resourceId, pageNumber, scope = 'page' } = req.body;

  // Validate required fields
  if (!sessionId || !resourceId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'sessionId and resourceId are required',
        statusCode: 400
      }
    });
  }

  // Validate UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId) || !uuidRegex.test(resourceId)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'sessionId and resourceId must be valid UUIDs',
        statusCode: 400
      }
    });
  }

  // Validate scope
  if (scope && !['page', 'selection'].includes(scope)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'scope must be "page" or "selection"',
        statusCode: 400
      }
    });
  }

  // Validate page number if provided
  if (pageNumber !== undefined && (typeof pageNumber !== 'number' || pageNumber < 1)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'pageNumber must be a positive number',
        statusCode: 400
      }
    });
  }

  // Validate scope compatibility
  if (scope === 'page' && !pageNumber) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'pageNumber is required when scope is "page"',
        statusCode: 400
      }
    });
  }

  try {
    // Step 1: Determine content source based on scope
    let contentText = '';
    let contentPageNumber = pageNumber || 1;

    if (scope === 'page' && pageNumber) {
      // Fetch content for the specified page
      const pageData = await AIService.fetchPageContent(resourceId, pageNumber);
      contentText = pageData.content;
    } else if (scope === 'selection') {
      // For selection scope, use a default page or fetch from context
      // In production, this would fetch from study_contexts.current_view_metadata
      if (pageNumber) {
        const pageData = await AIService.fetchPageContent(resourceId, pageNumber);
        contentText = pageData.content;
      } else {
        const pageData = await AIService.fetchPageContent(resourceId, 1);
        contentText = pageData.content;
        contentPageNumber = 1;
      }
    }

    if (!contentText) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No content available for notes generation',
          statusCode: 400
        }
      });
    }

    // Step 2: Enrich context with related memories from Qdrant
    const enrichment = await AIService.enrichContextWithMemories(
      userId,
      sessionId,
      resourceId,
      contentText,
      5 // Limit to 5 related memories
    );

    // Step 3: Build structured prompt for notes generation
    const prompt = AIService.buildNotesPrompt({
      contentText,
      scope,
      relatedMemories: enrichment.relatedMemories,
      resourceId,
      pageNumber: contentPageNumber,
      sessionId
    });

    // Step 4: Generate notes (mock LLM for now)
    const response = await Promise.resolve(AIService.generateMockNotes(prompt));

    // Step 5: Store notes in database
    const stored = await AIService.storeNotes(
      userId,
      sessionId,
      resourceId,
      contentPageNumber,
      scope,
      prompt,
      response
    );

    // Step 6: Return notes to frontend
    res.status(200).json({
      success: true,
      data: {
        notesId: stored?.id || null,
        notes: response.notes,
        summary: response.summary,
        keyTerms: response.keyTerms,
        relatedConcepts: enrichment.relatedMemories.map(m => ({
          type: m.type,
          content: m.content,
          relevanceScore: m.score
        })),
        metadata: {
          resourceId,
          pageNumber: contentPageNumber,
          sessionId,
          scope,
          contextEnrichment: {
            foundRelatedMemories: enrichment.relatedMemories.length,
            insight: enrichment.contextualInsights
          },
          generatedAt: new Date().toISOString(),
          model: response.model,
          wordCount: response.wordCount,
          responseTimeMs: response.responseTimeMs,
          tokensUsed: response.tokensUsed
        }
      }
    });
  } catch (error) {
    console.error('AI notes generation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate notes',
        statusCode: 500
      }
    });
  }
});

module.exports = {
  explain,
  notes
};
