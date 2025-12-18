const { v4: uuidv4 } = require('uuid');
const {
  upsertVector,
  upsertVectorsBatch,
  searchSimilarVectors,
  deleteVector,
  deleteUserVectors
} = require('../qdrant.client');

/**
 * Store a new memory with auto-generated ID
 * 
 * @param {string} userId - User UUID
 * @param {number[]} embedding - Vector embedding (1536 dimensions)
 * @param {string} memoryType - Type: 'preference', 'weakness', 'habit', 'concept', 'fact'
 * @param {string} content - Text content
 * @param {number} confidenceScore - 0.0 to 1.0
 * @param {object} metadata - Additional data
 * 
 * @returns {Promise<{id: string, success: true}>}
 */
async function storeMemory(userId, embedding, memoryType, content, confidenceScore = 1.0, metadata = {}) {
  const memoryId = uuidv4();

  await upsertVector({
    id: memoryId,
    embedding,
    userId,
    memoryType,
    content,
    confidenceScore,
    metadata: {
      ...metadata,
      storedAt: new Date().toISOString()
    }
  });

  return {
    id: memoryId,
    success: true
  };
}

/**
 * Store multiple memories in batch
 * 
 * @param {string} userId - User UUID
 * @param {Array} memories - Array of {embedding, memoryType, content, confidenceScore, metadata}
 * 
 * @returns {Promise<{count: number, success: true}>}
 */
async function storeMemoriesBatch(userId, memories) {
  const points = memories.map(m => ({
    id: uuidv4(),
    embedding: m.embedding,
    userId,
    memoryType: m.memoryType,
    content: m.content,
    confidenceScore: m.confidenceScore || 1.0,
    metadata: {
      ...m.metadata,
      batchStoredAt: new Date().toISOString()
    }
  }));

  await upsertVectorsBatch(points);

  return {
    count: points.length,
    success: true
  };
}

/**
 * Find similar memories for a user
 * 
 * @param {string} userId - User UUID
 * @param {number[]} embedding - Query vector
 * @param {object} options - Search options
 *   - limit: number (default: 10)
 *   - scoreThreshold: number (default: 0.7)
 *   - memoryTypes: string[] (optional)
 *   - minConfidence: number (optional)
 * 
 * @returns {Promise<Array>} Array of memories
 */
async function findSimilarMemories(userId, embedding, options = {}) {
  const {
    limit = 10,
    scoreThreshold = 0.7,
    memoryTypes = null,
    minConfidence = null
  } = options;

  const results = await searchSimilarVectors({
    embedding,
    userId,
    limit,
    scoreThreshold,
    memoryTypes
  });

  // Filter by minConfidence if specified
  if (minConfidence !== null) {
    return results.filter(r => r.confidenceScore >= minConfidence);
  }

  return results;
}

/**
 * Delete a specific memory
 * 
 * @param {string} memoryId - Memory UUID
 */
async function deleteMemory(memoryId) {
  await deleteVector(memoryId);
  return { success: true };
}

/**
 * Clear all memories for a user
 * 
 * @param {string} userId - User UUID
 */
async function clearUserMemories(userId) {
  await deleteUserVectors(userId);
  return { success: true };
}

/**
 * Store a learning weakness
 * 
 * @param {string} userId - User UUID
 * @param {number[]} embedding - Vector
 * @param {string} description - What they struggle with
 * @param {number} confidence - How sure are we
 */
async function storeWeakness(userId, embedding, description, confidence = 0.85) {
  return storeMemory(userId, embedding, 'weakness', description, confidence, {
    category: 'academic_struggle'
  });
}

/**
 * Store a learning preference
 * 
 * @param {string} userId - User UUID
 * @param {number[]} embedding - Vector
 * @param {string} preference - What they prefer
 * @param {number} confidence - How sure are we
 */
async function storePreference(userId, embedding, preference, confidence = 0.90) {
  return storeMemory(userId, embedding, 'preference', preference, confidence, {
    category: 'learning_style'
  });
}

/**
 * Store a learning habit
 * 
 * @param {string} userId - User UUID
 * @param {number[]} embedding - Vector
 * @param {string} habit - What they tend to do
 * @param {number} confidence - How sure are we
 */
async function storeHabit(userId, embedding, habit, confidence = 0.80) {
  return storeMemory(userId, embedding, 'habit', habit, confidence, {
    category: 'behavior_pattern'
  });
}

/**
 * Store a concept understanding
 * 
 * @param {string} userId - User UUID
 * @param {number[]} embedding - Vector
 * @param {string} concept - What they understand
 * @param {number} confidence - Mastery level
 */
async function storeConceptUnderstanding(userId, embedding, concept, confidence = 0.75) {
  return storeMemory(userId, embedding, 'concept', concept, confidence, {
    category: 'concept_mastery'
  });
}

/**
 * Find weaknesses for intervention
 * 
 * @param {string} userId - User UUID
 * @param {number[]} queryEmbedding - Context embedding
 */
async function findWeaknesses(userId, queryEmbedding) {
  return findSimilarMemories(userId, queryEmbedding, {
    memoryTypes: ['weakness'],
    limit: 5,
    minConfidence: 0.75
  });
}

/**
 * Find relevant preferences for personalization
 * 
 * @param {string} userId - User UUID
 * @param {number[]} queryEmbedding - Context embedding
 */
async function findPreferences(userId, queryEmbedding) {
  return findSimilarMemories(userId, queryEmbedding, {
    memoryTypes: ['preference'],
    limit: 5
  });
}

/**
 * Find learned concepts
 * 
 * @param {string} userId - User UUID
 * @param {number[]} queryEmbedding - Topic embedding
 */
async function findConceptsLearned(userId, queryEmbedding) {
  return findSimilarMemories(userId, queryEmbedding, {
    memoryTypes: ['concept'],
    limit: 10,
    minConfidence: 0.70
  });
}

module.exports = {
  // Core operations
  storeMemory,
  storeMemoriesBatch,
  findSimilarMemories,
  deleteMemory,
  clearUserMemories,

  // Convenience methods for specific memory types
  storeWeakness,
  storePreference,
  storeHabit,
  storeConceptUnderstanding,

  // Convenience search methods
  findWeaknesses,
  findPreferences,
  findConceptsLearned
};
