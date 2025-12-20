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

  // Mock highlight snippets (raw, before deterministic mapping)
  const rawHighlights = [
    {
      text: primaryText.substring(0, Math.min(30, primaryText.length)),
      reason: 'Key definition'
    },
    {
      text: primaryText.substring(Math.max(0, primaryText.length - 30)),
      reason: 'Important application'
    }
  ];

  return {
    explanation,
    rawHighlights, // Will be mapped to content chunks by mapHighlightsToContent()
    responseTimeMs: Math.random() * 2000 + 500,
    model: 'mock-gpt-4',
    tokensUsed: Math.ceil(explanation.split(/\s+/).length * 1.3)
  };
}

/**
 * Deterministically map highlight snippets to actual content chunks
 * 
 * @param {Array} rawHighlights - Array of { text, reason } from LLM
 * @param {string} pageContent - Full content of the page
 * @param {string} resourceId - UUID of resource
 * @param {number} pageNumber - Page number
 * @returns {Array} Structured highlights with deterministic positions
 * 
 * Logic:
 * - Search for exact match of highlight text in page content
 * - If found: record position and character index
 * - If not found: mark as unmapped but still return (don't discard)
 * - Ensure reproducibility: same content = same positions always
 */
function mapHighlightsToContent(rawHighlights, pageContent, resourceId, pageNumber) {
  if (!Array.isArray(rawHighlights) || rawHighlights.length === 0) {
    return [];
  }

  const mappedHighlights = [];

  for (const highlight of rawHighlights) {
    const highlightText = highlight.text?.trim();
    
    if (!highlightText) {
      continue; // Skip empty highlights
    }

    // Search for exact match in page content (case-sensitive for determinism)
    const matchIndex = pageContent.indexOf(highlightText);
    
    if (matchIndex !== -1) {
      // Exact match found - deterministic position
      mappedHighlights.push({
        pageNumber,
        resourceId,
        text: highlightText,
        reason: highlight.reason || 'Important concept',
        position: matchIndex,
        found: true,
        matchedAgainstContent: true
      });
    } else {
      // No exact match - still include but mark as unmapped
      // This allows frontend to render with lower priority or different styling
      mappedHighlights.push({
        pageNumber,
        resourceId,
        text: highlightText,
        reason: highlight.reason || 'Important concept',
        position: null,
        found: false,
        matchedAgainstContent: false,
        note: 'Highlight not found in page content - may be from context enrichment'
      });
    }
  }

  return mappedHighlights;
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
    console.warn('Explanation not persisted but will be returned to client');
    return null;
  }
}

/**
 * Build structured prompt for notes generation
 */
function buildNotesPrompt({
  contentText,
  scope,
  relatedMemories,
  resourceId,
  pageNumber,
  sessionId
}) {
  return {
    instruction: 'You are a helpful study assistant. Generate clear, well-organized study notes from the given content.',
    contentText,
    taskType: 'notes',
    scope, // "page" or "selection"
    context: {
      resourceId,
      pageNumber,
      sessionId
    },
    relatedConcepts: relatedMemories.map(m => `(${m.type}) ${m.content}`),
    formatRequirements: {
      format: 'Bullet points or structured sections',
      style: 'Concise and informative',
      includeHeadings: true,
      highlightKeyTerms: true
    }
  };
}

/**
 * Generate study notes using mock LLM
 * In production, this would call an actual LLM API
 */
function generateMockNotes(promptObj) {
  const contentText = promptObj.contentText;
  const concepts = promptObj.relatedConcepts || [];
  
  // Mock notes generation
  const notes = `# Study Notes\n\n## Key Concepts\n- ${contentText.substring(0, 50)}...\n- Important topic 1\n- Important topic 2\n\n## Details\n${concepts.length > 0 ? `Related to: ${concepts.slice(0, 2).join(', ')}\n\n` : ''}## Summary\nThis section covers the fundamental concepts and their applications.\n\n## Key Takeaways\n1. Primary concept from the content\n2. Supporting details and examples\n3. Practical applications`;

  // Mock summary (for frontend preview)
  const summary = contentText.substring(0, 100) + '...';

  return {
    notes,
    summary,
    wordCount: notes.split(/\s+/).length,
    keyTerms: ['Concept 1', 'Concept 2', 'Concept 3'],
    responseTimeMs: Math.random() * 2000 + 500,
    model: 'mock-gpt-4',
    tokensUsed: Math.ceil(notes.split(/\s+/).length * 1.3)
  };
}

/**
 * Store notes in learning_requests table
 */
async function storeNotes(userId, sessionId, resourceId, pageNumber, scope, prompt, response) {
  try {
    const { v4: uuidv4 } = require('uuid');
    const notesId = uuidv4();
    
    const query = `
      INSERT INTO learning_requests 
        (id, user_id, resource_id, request_type, context_text, preferences, 
         status, generated_content, ml_response_payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at, updated_at
    `;

    const generatedContent = {
      notes: response.notes,
      summary: response.summary,
      keyTerms: response.keyTerms,
      scope,
      pageNumber,
      sessionId
    };

    const mlResponsePayload = {
      wordCount: response.wordCount,
      model: response.model,
      tokensUsed: response.tokensUsed,
      responseTimeMs: response.responseTimeMs
    };

    const result = await pool.query(query, [
      notesId,
      userId,
      resourceId,
      'notes',
      prompt.contentText || '',
      JSON.stringify({ scope, pageNumber }),
      'completed',
      JSON.stringify(generatedContent),
      JSON.stringify(mlResponsePayload)
    ]);

    return {
      id: notesId,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  } catch (error) {
    console.error('Failed to store notes:', error);
    console.warn('Notes not persisted but will be returned to client');
    return null;
  }
}

/**
 * Build structured prompt for flashcards generation
 */
function buildFlashcardsPrompt({
  contentText,
  scope,
  relatedMemories,
  resourceId,
  pageNumber,
  sessionId
}) {
  return {
    instruction: 'You are a helpful study assistant. Generate effective flashcard questions and answers from the given content.',
    contentText,
    taskType: 'flashcards',
    scope, // "page" or "selection"
    context: {
      resourceId,
      pageNumber,
      sessionId
    },
    relatedConcepts: relatedMemories.map(m => `(${m.type}) ${m.content}`),
    formatRequirements: {
      format: 'Q&A pairs',
      style: 'Clear and concise',
      numberOfCards: 5,
      difficulty: 'intermediate'
    }
  };
}

/**
 * Generate flashcards using mock LLM
 * In production, this would call an actual LLM API
 */
function generateMockFlashcards(promptObj) {
  const contentText = promptObj.contentText;
  const concepts = promptObj.relatedConcepts || [];
  
  // Mock flashcards generation - deterministic based on content
  const flashcards = [
    {
      question: `What is the main topic covered in this content about "${contentText.substring(0, 30)}..."?`,
      answer: 'This covers fundamental concepts and their key principles.',
      difficulty: 'basic',
      source: 'primary-content'
    },
    {
      question: 'What are the key points from this section?',
      answer: `1. Important concept from the content\n2. Supporting details and examples\n3. Practical applications`,
      difficulty: 'intermediate',
      source: 'primary-content'
    },
    {
      question: 'How does this relate to the broader topic?',
      answer: concepts.length > 0 ? `This connects to: ${concepts.slice(0, 2).join(', ')}` : 'This forms the foundation for advanced topics.',
      difficulty: 'intermediate',
      source: concepts.length > 0 ? 'enriched-context' : 'primary-content'
    },
    {
      question: 'What are the practical applications?',
      answer: 'Key applications include problem-solving, analysis, and real-world implementation of concepts.',
      difficulty: 'advanced',
      source: 'primary-content'
    },
    {
      question: 'What should be remembered most from this section?',
      answer: `The critical takeaway is understanding the fundamental principle and its implications.`,
      difficulty: 'basic',
      source: 'primary-content'
    }
  ];

  return {
    flashcards,
    totalCards: flashcards.length,
    cardCount: flashcards.length,
    responseTimeMs: Math.random() * 2000 + 500,
    model: 'mock-gpt-4',
    tokensUsed: Math.ceil(JSON.stringify(flashcards).split(/\s+/).length * 1.3)
  };
}

/**
 * Store flashcards in learning_requests table
 */
async function storeFlashcards(userId, sessionId, resourceId, pageNumber, scope, prompt, response) {
  try {
    const { v4: uuidv4 } = require('uuid');
    const flashcardsId = uuidv4();
    
    const query = `
      INSERT INTO learning_requests 
        (id, user_id, resource_id, request_type, context_text, preferences, 
         status, generated_content, ml_response_payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at, updated_at
    `;

    const generatedContent = {
      flashcards: response.flashcards,
      totalCards: response.totalCards,
      scope,
      pageNumber,
      sessionId
    };

    const mlResponsePayload = {
      cardCount: response.cardCount,
      model: response.model,
      tokensUsed: response.tokensUsed,
      responseTimeMs: response.responseTimeMs
    };

    const result = await pool.query(query, [
      flashcardsId,
      userId,
      resourceId,
      'flashcard',
      prompt.contentText || '',
      JSON.stringify({ scope, pageNumber }),
      'completed',
      JSON.stringify(generatedContent),
      JSON.stringify(mlResponsePayload)
    ]);

    return {
      id: flashcardsId,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  } catch (error) {
    console.error('Failed to store flashcards:', error);
    console.warn('Flashcards not persisted but will be returned to client');
    return null;
  }
}

/**
 * Build structured prompt for diagram generation
 */
function buildDiagramPrompt({
  contentText,
  scope,
  diagramType,
  relatedMemories,
  resourceId,
  pageNumber,
  sessionId
}) {
  return {
    instruction: `You are a helpful study assistant. Generate a clear ${diagramType} representing the concept hierarchy and relationships using Mermaid syntax.`,
    contentText,
    taskType: 'diagram',
    diagramType, // "mindmap" or "flowchart"
    scope, // "page" or "selection"
    context: {
      resourceId,
      pageNumber,
      sessionId
    },
    relatedConcepts: relatedMemories.map(m => `(${m.type}) ${m.content}`),
    formatRequirements: {
      format: 'Mermaid diagram syntax',
      style: 'Clear and hierarchical',
      diagramType,
      includeRelationships: true
    }
  };
}

/**
 * Generate diagram using mock LLM (deterministic Mermaid output)
 * Returns Mermaid syntax for mindmap or flowchart
 */
function generateMockDiagram(promptObj) {
  const contentText = promptObj.contentText;
  const diagramType = promptObj.diagramType || 'mindmap';
  const concepts = promptObj.relatedConcepts || [];
  
  let mermaidCode = '';

  if (diagramType === 'mindmap') {
    // Deterministic mindmap based on content
    mermaidCode = `mindmap
  root((Main Concept))
    Introduction
      Foundational Topics
      Key Definitions
    Core Principles
      Primary Concept
      Supporting Details
      ${concepts.length > 0 ? 'Related Concepts' : 'Applications'}
    ${concepts.length > 0 ? concepts.slice(0, 2).map(c => `\n    ${c}`).join('') : 'Practical Examples\n      Use Case 1\n      Use Case 2'}
    Summary & Takeaways
      Key Points
      Review`;
  } else if (diagramType === 'flowchart') {
    // Deterministic flowchart based on content
    mermaidCode = `flowchart TD
    A["Start: Understanding ${contentText.substring(0, 20)}..."]
    B["Foundational Concepts<br/>Core Principles"]
    C{"Key Decision<br/>Point"}
    D["Primary Content<br/>Detailed Analysis"]
    E["Supporting Details<br/>Related Context"]
    F["Applications<br/>Real-world Examples"]
    G["Summary<br/>Key Takeaways"]
    
    A --> B
    B --> C
    C -->|Yes| D
    C -->|No| E
    D --> F
    E --> F
    F --> G`;
  }

  return {
    diagram: mermaidCode,
    diagramType,
    format: 'mermaid',
    responseTimeMs: Math.random() * 2000 + 500,
    model: 'mock-gpt-4',
    tokensUsed: Math.ceil(mermaidCode.split(/\s+/).length * 1.3)
  };
}

/**
 * Store diagram in learning_requests table
 */
async function storeDiagram(userId, sessionId, resourceId, pageNumber, scope, diagramType, prompt, response) {
  try {
    const { v4: uuidv4 } = require('uuid');
    const diagramId = uuidv4();
    
    const query = `
      INSERT INTO learning_requests 
        (id, user_id, resource_id, request_type, context_text, preferences, 
         status, generated_content, ml_response_payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at, updated_at
    `;

    const generatedContent = {
      diagram: response.diagram,
      diagramType: response.diagramType,
      format: response.format,
      scope,
      pageNumber,
      sessionId
    };

    const mlResponsePayload = {
      diagramType: response.diagramType,
      format: response.format,
      model: response.model,
      tokensUsed: response.tokensUsed,
      responseTimeMs: response.responseTimeMs
    };

    const result = await pool.query(query, [
      diagramId,
      userId,
      resourceId,
      'diagram',
      prompt.contentText || '',
      JSON.stringify({ scope, pageNumber, diagramType }),
      'completed',
      JSON.stringify(generatedContent),
      JSON.stringify(mlResponsePayload)
    ]);

    return {
      id: diagramId,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  } catch (error) {
    console.error('Failed to store diagram:', error);
    console.warn('Diagram not persisted but will be returned to client');
    return null;
  }
}

module.exports = {
  generateMockEmbedding,
  fetchPageContent,
  enrichContextWithMemories,
  buildExplanationPrompt,
  generateMockExplanation,
  mapHighlightsToContent,
  storeExplanation,
  buildNotesPrompt,
  generateMockNotes,
  storeNotes,
  buildFlashcardsPrompt,
  generateMockFlashcards,
  storeFlashcards,
  buildDiagramPrompt,
  generateMockDiagram,
  storeDiagram
};
