const asyncHandler = require('../middlewares/asyncHandler');
const ContextService = require('../services/context.service');
const { pool } = require('../db');

/**
 * POST /study/context
 * Sync user's current study context with session data
 * Stores: session_id, resource_id, page_number, visible_text, selected_text
 */
const syncStudyContext = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId, resourceId, pageNumber, visibleText, selectedText } = req.body;

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

  // Validate UUIDs format (basic check)
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

  try {
    // Build metadata object with session and view details
    const metadata = {
      sessionId,
      visibleText: visibleText || null,
      selectedText: selectedText || null,
      syncedAt: new Date().toISOString()
    };

    // Update context in service (memory + async DB persistence)
    const context = await ContextService.updateContext(userId, resourceId, {
      pageNumber: pageNumber || null,
      metadata
    });

    // Return response
    res.status(200).json({
      success: true,
      data: {
        contextId: context.id || null,
        sessionId,
        resourceId,
        pageNumber: context.pageNumber || null,
        visibleText: visibleText || null,
        selectedText: selectedText || null,
        lastUpdated: context.updatedAt
      }
    });
  } catch (error) {
    console.error('Study context sync error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to sync study context',
        statusCode: 500
      }
    });
  }
});

module.exports = {
  syncStudyContext
};
