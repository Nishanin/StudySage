const { QdrantClient } = require('@qdrant/qdrant-js');

const QDRANT_URL = process.env.QDRANT_ENDPOINT || process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'ai_memory';
const VECTOR_SIZE = parseInt(process.env.EMBEDDING_SIZE || '1536', 10);

const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY
});

/**
 * Test connection to Qdrant server
 * @returns {Promise<boolean>} True if connection successful
 */
async function testConnection() {
  const started = Date.now();
  try {
    // Simple health check - list collections to verify connectivity
    await qdrantClient.getCollections();
    const elapsed = Date.now() - started;
    console.log(`✅ Qdrant connected in ${elapsed}ms (url=${QDRANT_URL})`);
    return true;
  } catch (err) {
    console.error('❌ Qdrant connection failed:', err.message);
    return false;
  }
}

/**
 * Create collection if it doesn't exist
 * 
 * Collection schema:
 * - Vectors: 1536 dimensions (default embedding size)
 * - Distance: Cosine similarity
 * - Payload indexed fields: user_id, memory_type, confidence_score
 * 
 * @returns {Promise<void>}
 */
async function ensureCollection() {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (exists) {
      console.log(`📦 Qdrant collection '${COLLECTION_NAME}' already exists`);
      return;
    }

    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine' 
      },
      optimizers_config: {
        indexing_threshold: 10000
      }
    });

    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'user_id',
      field_schema: 'keyword' 
    });

    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'memory_type',
      field_schema: 'keyword' 
    });

    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'confidence_score',
      field_schema: 'float' 
    });

    console.log(`✅ Qdrant collection '${COLLECTION_NAME}' created successfully`);
  } catch (err) {
    console.error('❌ Failed to create Qdrant collection:', err.message);
    throw err;
  }
}

/**
 * Upsert vector embeddings with metadata
 * 
 * @param {Object} params
 * @param {string} params.id - Unique identifier (UUID)
 * @param {number[]} params.embedding - Vector embedding array (size: 1536)
 * @param {string} params.userId - User UUID
 * @param {string} params.memoryType - Type: 'preference', 'weakness', 'habit', 'concept', 'fact'
 * @param {string} params.content - Text content of the memory
 * @param {number} params.confidenceScore - Confidence score (0.0 to 1.0)
 * @param {Object} [params.metadata] - Additional metadata
 * @returns {Promise<void>}
 */
async function upsertVector({ 
  id, 
  embedding, 
  userId, 
  memoryType, 
  content, 
  confidenceScore,
  metadata = {}
}) {
  try {
    // Validate embedding size
    if (!Array.isArray(embedding) || embedding.length !== VECTOR_SIZE) {
      throw new Error(`Embedding must be an array of ${VECTOR_SIZE} numbers`);
    }

    // Validate confidence score
    if (confidenceScore < 0 || confidenceScore > 1) {
      throw new Error('Confidence score must be between 0 and 1');
    }

    const point = {
      id, // UUID as string
      vector: embedding,
      payload: {
        user_id: userId,
        memory_type: memoryType,
        content,
        confidence_score: confidenceScore,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...metadata // Allow additional fields
      }
    };

    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true, // Wait for operation to complete
      points: [point]
    });

    console.log(`📝 Vector upserted: id=${id} user=${userId} type=${memoryType}`);
  } catch (err) {
    console.error('❌ Failed to upsert vector:', err.message);
    throw err;
  }
}

/**
 * Upsert multiple vectors in batch (more efficient for bulk operations)
 * 
 * @param {Array<Object>} vectors - Array of vector objects (same schema as upsertVector)
 * @returns {Promise<void>}
 */
async function upsertVectorsBatch(vectors) {
  try {
    const points = vectors.map(v => ({
      id: v.id,
      vector: v.embedding,
      payload: {
        user_id: v.userId,
        memory_type: v.memoryType,
        content: v.content,
        confidence_score: v.confidenceScore,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(v.metadata || {})
      }
    }));

    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points
    });

    console.log(`📝 Batch upserted ${vectors.length} vectors`);
  } catch (err) {
    console.error('❌ Failed to batch upsert vectors:', err.message);
    throw err;
  }
}

/**
 * Search for similar vectors using semantic similarity
 * 
 * @param {Object} params
 * @param {number[]} params.embedding - Query vector (size: 1536)
 * @param {string} params.userId - Filter by user ID
 * @param {number} [params.limit=10] - Maximum number of results
 * @param {number} [params.scoreThreshold=0.7] - Minimum similarity score (0.0 to 1.0)
 * @param {string[]} [params.memoryTypes] - Filter by memory types
 * @returns {Promise<Array>} Array of matching memories with scores
 */
async function searchSimilarVectors({ 
  embedding, 
  userId, 
  limit = 10, 
  scoreThreshold = 0.7,
  memoryTypes = null
}) {
  try {
    // Validate embedding
    if (!Array.isArray(embedding) || embedding.length !== VECTOR_SIZE) {
      throw new Error(`Query embedding must be an array of ${VECTOR_SIZE} numbers`);
    }

    // Build filter for user and optional memory types
    const filter = {
      must: [
        {
          key: 'user_id',
          match: { value: userId }
        }
      ]
    };

    // Add memory type filter if specified
    if (memoryTypes && memoryTypes.length > 0) {
      filter.must.push({
        key: 'memory_type',
        match: { any: memoryTypes }
      });
    }

    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: embedding,
      filter,
      limit,
      score_threshold: scoreThreshold, // Only return results above this similarity
      with_payload: true, // Include metadata in results
      with_vector: false // Don't return vectors (save bandwidth)
    });

    console.log(`🔍 Found ${searchResult.length} similar vectors for user ${userId}`);

    // Transform results to a cleaner format
    return searchResult.map(result => ({
      id: result.id,
      score: result.score, // Similarity score (higher = more similar)
      userId: result.payload.user_id,
      memoryType: result.payload.memory_type,
      content: result.payload.content,
      confidenceScore: result.payload.confidence_score,
      createdAt: result.payload.created_at,
      updatedAt: result.payload.updated_at,
      metadata: result.payload // Full payload for additional fields
    }));
  } catch (err) {
    console.error('❌ Failed to search vectors:', err.message);
    throw err;
  }
}

/**
 * Delete a vector by ID
 * 
 * @param {string} id - Vector UUID
 * @returns {Promise<void>}
 */
async function deleteVector(id) {
  try {
    await qdrantClient.delete(COLLECTION_NAME, {
      wait: true,
      points: [id]
    });
    console.log(`🗑️  Vector deleted: id=${id}`);
  } catch (err) {
    console.error('❌ Failed to delete vector:', err.message);
    throw err;
  }
}

/**
 * Delete all vectors for a specific user
 * 
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
async function deleteUserVectors(userId) {
  try {
    await qdrantClient.delete(COLLECTION_NAME, {
      wait: true,
      filter: {
        must: [
          {
            key: 'user_id',
            match: { value: userId }
          }
        ]
      }
    });
    console.log(`🗑️  All vectors deleted for user: ${userId}`);
  } catch (err) {
    console.error('❌ Failed to delete user vectors:', err.message);
    throw err;
  }
}

module.exports = {
  qdrantClient,
  testConnection,
  ensureCollection,
  upsertVector,
  upsertVectorsBatch,
  searchSimilarVectors,
  deleteVector,
  deleteUserVectors,
  COLLECTION_NAME,
  VECTOR_SIZE
};
