const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { searchSimilarVectors } = require('../qdrant.client');

/**
 * Generate deterministic mock embedding from text
 * Same algorithm as in chat.controller.js for consistency
 */
function generateMockEmbedding(text, size = parseInt(process.env.EMBEDDING_SIZE || '1536', 10)) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  let x = h >>> 0;
  const arr = new Array(size);
  for (let i = 0; i < size; i++) {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    arr[i] = (x % 100000) / 100000;
  }
  return arr;
}

/**
 * Fetch content chunks for a given page (mock implementation)
 * In production, this would query a content_chunks table
 */
async function fetchPageContent(resourceId, pageNumber) {
  try {
    // Mock: return deterministic content based on page number
    const mockContent = {
      [1]: "Introduction to the topic. Key definitions and foundational concepts.",
      [2]: "Core principles and theoretical framework. Important formulas.",
      [3]: "Applications and practical examples. Real-world use cases.",
      [4]: "Advanced topics and extensions. Future research directions.",
      [5]: "Summary and review. Key takeaways and important points."
    };

    const content = mockContent[pageNumber] || `Content for page ${pageNumber} of resource ${resourceId}`;
    
    return {
      resourceId,
      pageNumber,
      content,
      wordCount: content.split(/\s+/).length,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to fetch page content:', error);
    throw error;
  }
}

/**
 * Search for related memories in Qdrant based on selected text
 */
async function enrichContextWithMemories(userId, sessionId, resourceId, textToEnrich, limit = 5) {
  try {
    // Generate embedding for the text
    const embedding = generateMockEmbedding(textToEnrich);

    // Search Qdrant for related memories
    const relatedMemories = await searchSimilarVectors({
      embedding,
      userId,
      limit,
      scoreThreshold: 0.65 // Lower threshold for enrichment
    });

    return {
      relatedMemories: relatedMemories.map(m => ({
        id: m.id,
        score: m.score,
        type: m.payload.memory_type,
        content: m.payload.content
      })),
      contextualInsights: relatedMemories.length > 0 
        ? `Found ${relatedMemories.length} related concepts from your study history.`
        : 'No related prior context found.'
    };
  } catch (error) {
    console.error('Failed to enrich context with memories:', error);
    // Return safe default on error
    return {
      relatedMemories: [],
      contextualInsights: 'Could not retrieve related context.'
    };
  }
}

/**
 * Build structured prompt for explanation
 */
function buildExplanationPrompt({
  selectedText,
  pageContent,
  relatedMemories,
  resourceId,
  pageNumber,
  sessionId
}) {
  const primaryText = selectedText || pageContent;
  
  return {
    instruction: 'You are a helpful study assistant. Provide a clear, concise explanation of the given text.',
    primaryText,
    context: {
      resourceId,
      pageNumber,
      sessionId
    },
    relatedConcepts: relatedMemories.map(m => `(${m.type}) ${m.content}`),
    taskType: 'explain',
    formatRequirements: {
      explanation: 'Clear, educational explanation',
      highlights: ['Key terms', 'Important concepts', 'Critical definitions'],
      format: 'Use simple language. Include examples if relevant.'
    }
  };
}

/**
 * Generate explanation using mock LLM
 * In production, this would call an actual LLM API
 */
function generateMockExplanation(promptObj) {
  const primaryText = promptObj.primaryText;
  const concepts = promptObj.relatedConcepts || [];
  
  // Mock explanation
  const explanation = `This explains the following concept: "${primaryText.substring(0, 60)}..." 
  
The key idea here is to understand how this relates to your broader learning objectives. ${concepts.length > 0 ? `This connects to previously studied concepts: ${concepts.slice(0, 2).join('; ')}` : ''}
  
Key takeaways: 1) The foundational principle. 2) How it applies in practice. 3) Connection to related topics.`;

  // Mock highlight snippets
  const highlights = [
    {
      text: primaryText.substring(0, Math.min(30, primaryText.length)),
      reason: 'Key definition',
      position: 0
    },
    {
      text: primaryText.substring(Math.max(0, primaryText.length - 30)),
      reason: 'Important application',
      position: primaryText.length - 30
    }
  ];

  return {
    explanation,
    highlights,
    responseTimeMs: Math.random() * 2000 + 500,
    model: 'mock-gpt-4',
    tokensUsed: Math.ceil(explanation.split(/\s+/).length * 1.3)
  };
}

/**
 * Store explanation in database
 */
async function storeExplanation(userId, sessionId, resourceId, pageNumber, prompt, response) {
  try {
    const explanationId = uuidv4();
    
    const query = `
      INSERT INTO chat_messages 
        (id, user_id, session_id, role, content, context_snapshot, 
         tokens_used, model_name, response_time_ms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at
    `;

    const contextSnapshot = {
      resourceId,
      pageNumber,
      sessionId,
      taskType: 'explain',
      highlightSnippets: response.highlights.map(h => h.text)
    };

    const result = await pool.query(query, [
      explanationId,
      userId,
      sessionId,
      'assistant',
      response.explanation,
      JSON.stringify(contextSnapshot),
      response.tokensUsed,
      response.model,
      response.responseTimeMs
    ]);

    return {
      id: explanationId,
      createdAt: result.rows[0].created_at
    };
  } catch (error) {
    console.error('Failed to store explanation:', error);
    // Don't throw - allow response to be returned even if storage fails
    console.warn('Explanation not persisted but will be returned to client');
    return null;
  }
}

module.exports = {
  generateMockEmbedding,
  fetchPageContent,
  enrichContextWithMemories,
  buildExplanationPrompt,
  generateMockExplanation,
  storeExplanation
};
