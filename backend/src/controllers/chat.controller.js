const { pool } = require('../db');
const asyncHandler = require('../middlewares/asyncHandler');
const ContextService = require('../services/context.service');
const SessionService = require('../services/session.service');
const { searchSimilarVectors } = require('../qdrant.client');

// Deterministic mock embedding generator (size 1536)
function generateMockEmbedding(text, size = parseInt(process.env.EMBEDDING_SIZE || '1536', 10)) {
  // Simple xorshift-based PRNG seeded by string hash
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  let x = h >>> 0;
  const arr = new Array(size);
  for (let i = 0; i < size; i++) {
    // xorshift32
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    // Map to [0,1)
    arr[i] = (x % 100000) / 100000;
  }
  return arr;
}

async function getRecentHistory(userId, sessionId = null, limit = 20) {
  if (sessionId) {
    const q = `
      SELECT role, content, context_snapshot, created_at
      FROM chat_messages
      WHERE user_id = $1 AND session_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;
    const r = await pool.query(q, [userId, sessionId, limit]);
    return r.rows.reverse();
  }
  const q = `
    SELECT role, content, context_snapshot, created_at
    FROM chat_messages
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;
  const r = await pool.query(q, [userId, limit]);
  return r.rows.reverse();
}

function buildStructuredPrompt({ userMessage, studyContext, recentMessages, relatedMemories }) {
  return {
    instruction: 'You are a helpful study assistant. Answer concisely and cite relevant prior user context when useful.',
    userMessage,
    studyContext,
    recentMessages: recentMessages.map(m => ({ role: m.role, content: m.content, at: m.created_at })),
    relatedMemories: relatedMemories.map(m => ({ id: m.id, score: m.score, type: m.memoryType, content: m.content }))
  };
}

// Very simple mock LLM response
function mockLLMResponse(promptObj) {
  const memoryHint = promptObj.relatedMemories && promptObj.relatedMemories[0]
    ? ` I recall: (${promptObj.relatedMemories[0].type}) ${promptObj.relatedMemories[0].content}`
    : '';
  const contextHint = promptObj.studyContext && promptObj.studyContext.resourceId
    ? ' I will tailor this to your current study context.'
    : '';
  return `Here’s a helpful response to: "${promptObj.userMessage}".${contextHint}${memoryHint}`;
}

/**
 * POST /chat
 * Body: { message: string, context?: object, memoryUpdates?: Array<{ embedding:number[], memoryType:string, content:string, confidenceScore:number, metadata?:object }> }
 */
const postChat = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { message, context: contextOverride, memoryUpdates = [] } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'message is required', statusCode: 400 }
    });
  }

  // Get active session (if any)
  const activeSession = await SessionService.getActiveSession(userId);
  const sessionId = activeSession?.id || null;

  // Get study context (allow override)
  const liveContext = contextOverride || (await ContextService.getCurrentContext(userId));

  // Get recent history
  const recentMessages = await getRecentHistory(userId, sessionId, 20);

  // Build a mock embedding and query Qdrant for related memories
  const startedAt = Date.now();
  let relatedMemories = [];
  try {
    const queryVector = generateMockEmbedding(message);
    relatedMemories = await searchSimilarVectors({
      embedding: queryVector,
      userId,
      limit: 5,
      scoreThreshold: 0.6,
      memoryTypes: null
    });
  } catch (e) {
    // If Qdrant fails, continue without memories
    relatedMemories = [];
  }

  // Build structured prompt and mock an LLM response
  const promptObj = buildStructuredPrompt({
    userMessage: message,
    studyContext: liveContext || null,
    recentMessages,
    relatedMemories
  });

  const responseText = mockLLMResponse(promptObj);
  const responseTimeMs = Date.now() - startedAt;

  // Persist user message
  const insertUserQuery = `
    INSERT INTO chat_messages (user_id, session_id, role, content, context_snapshot, model_name, response_time_ms)
    VALUES ($1, $2, 'user', $3, $4, $5, $6)
    RETURNING id, created_at
  `;
  const userContextSnapshot = {
    usedContext: contextOverride ? 'override' : 'live',
    context: liveContext || null
  };
  const userMsgResult = await pool.query(insertUserQuery, [
    userId,
    sessionId,
    message,
    JSON.stringify(userContextSnapshot),
    null,
    null
  ]);

  // Persist assistant message
  const insertAssistantQuery = `
    INSERT INTO chat_messages (user_id, session_id, role, content, context_snapshot, tokens_used, model_name, response_time_ms)
    VALUES ($1, $2, 'assistant', $3, $4, $5, $6, $7)
    RETURNING id, created_at
  `;
  const assistantContextSnapshot = {
    prompt: promptObj,
    relatedMemoryIds: relatedMemories.map(m => m.id),
  };
  const assistantMsgResult = await pool.query(insertAssistantQuery, [
    userId,
    sessionId,
    responseText,
    JSON.stringify(assistantContextSnapshot),
    null,
    'mock-llm',
    responseTimeMs
  ]);

  // Persist AI memory updates if provided (embeddings must come from ML)
  let persistedMemories = [];
  if (Array.isArray(memoryUpdates) && memoryUpdates.length > 0) {
    try {
      const { persistMemoryUpdates } = require('../services/memory.service');
      // Attach source ids to each update for lineage (optional)
      const enriched = memoryUpdates.map(m => ({
        ...m,
        source_session_id: sessionId,
        // If context includes resourceId, attach as source
        source_resource_id: (contextOverride?.resourceId) || (liveContext?.resourceId) || null
      }));
      persistedMemories = await persistMemoryUpdates(userId, enriched);
    } catch (err) {
      console.error('Failed to persist AI memories:', err.message);
      persistedMemories = [];
    }
  }

  res.status(200).json({
    success: true,
    data: {
      message: {
        id: assistantMsgResult.rows[0].id,
        role: 'assistant',
        content: responseText,
        createdAt: assistantMsgResult.rows[0].created_at
      },
      context: liveContext || null,
      relatedMemories: relatedMemories.map(m => ({ id: m.id, score: m.score, type: m.memoryType, content: m.content })),
      sessionId,
      responseTimeMs,
      persistedMemories
    }
  });
});

module.exports = {
  postChat
};
