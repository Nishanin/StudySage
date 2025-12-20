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
        highlights: response.highlights.map(h => ({
          text: h.text,
          reason: h.reason
        })),
        relatedConcepts: enrichment.relatedMemories.map(m => ({
          type: m.type,
          content: m.content,
          relevanceScore: m.score
        })),
        metadata: {
          resourceId,
          pageNumber: pageNumber || null,
          sessionId,
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

module.exports = {
  explain
};
