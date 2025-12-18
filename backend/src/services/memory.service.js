const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { upsertVector } = require('../qdrant.client');

/**
 * Normalize an incoming memory update object from ML.
 * Supports both camelCase and snake_case keys.
 */
function normalizeUpdate(update) {
  return {
    embedding: update.embedding,
    memoryType: update.memoryType || update.memory_type,
    content: update.content,
    confidenceScore: update.confidenceScore ?? update.confidence_score ?? 1.0,
    metadata: update.metadata || {},
    sourceResourceId: update.sourceResourceId || update.source_resource_id || null,
    sourceSessionId: update.sourceSessionId || update.source_session_id || null
  };
}

/**
 * Persist a single AI memory update:
 * - Upsert embedding into Qdrant (vectors only)
 * - Insert metadata into PostgreSQL (ai_memory_entries)
 * - Save qdrant_point_id in Postgres
 */
async function persistMemoryUpdate(userId, rawUpdate) {
  const update = normalizeUpdate(rawUpdate);

  if (!Array.isArray(update.embedding)) {
    throw new Error('embedding must be provided by ML and be an array');
  }

  if (!update.memoryType) {
    throw new Error('memoryType is required');
  }

  const qdrantPointId = uuidv4();

  // Upsert into Qdrant (embedding store)
  await upsertVector({
    id: qdrantPointId,
    embedding: update.embedding,
    userId,
    memoryType: update.memoryType,
    content: update.content || '',
    confidenceScore: update.confidenceScore,
    metadata: update.metadata
  });

  // Insert metadata into PostgreSQL (relational store)
  const insertSql = `
    INSERT INTO ai_memory_entries (
      user_id, memory_type, content, qdrant_point_id,
      source_resource_id, source_session_id,
      confidence_score, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, created_at
  `;

  const result = await pool.query(insertSql, [
    userId,
    update.memoryType,
    update.content || '',
    qdrantPointId,
    update.sourceResourceId,
    update.sourceSessionId,
    update.confidenceScore,
    JSON.stringify(update.metadata || {})
  ]);

  return {
    id: result.rows[0].id,
    qdrantPointId,
    createdAt: result.rows[0].created_at
  };
}

/**
 * Persist multiple memory updates in sequence.
 */
async function persistMemoryUpdates(userId, updates = []) {
  const out = [];
  for (const upd of updates) {
    const saved = await persistMemoryUpdate(userId, upd);
    out.push(saved);
  }
  return out;
}

module.exports = {
  persistMemoryUpdate,
  persistMemoryUpdates
};
