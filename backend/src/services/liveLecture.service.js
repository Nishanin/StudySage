const { pool } = require('../db');

const BUFFER_DURATION_MS = 60000;
const activeSessionBuffers = new Map();

/**
 * Create a new live lecture session
 * @param {string} userId - User ID
 * @param {string} [title] - Optional session title
 * @returns {Promise<object>} - Created session
 */
async function createSession(userId, title = null) {
  try {
    const query = `
      INSERT INTO live_lecture_sessions (user_id, title, processing_status)
      VALUES ($1, $2, 'active')
      RETURNING id, user_id, title, started_at, processing_status, created_at
    `;
    
    console.log('[LiveLecture] Creating session for user:', userId, 'title:', title);
    const result = await pool.query(query, [userId, title]);
    const session = result.rows[0];

    console.log('[LiveLecture] Session created:', session.id);

    // Initialize rolling buffer for this session
    activeSessionBuffers.set(session.id, {
      transcripts: [],
      lastCleanup: Date.now(),
      sequenceNumber: 0
    });

    return session;
  } catch (error) {
    console.error('[LiveLecture] Failed to create session:', error.message);
    console.error('[LiveLecture] Error details:', error);
    throw error;
  }
}

/**
 * Append transcript chunk to session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @param {string} transcriptText - Transcript text chunk
 * @param {number} timestampOffsetMs - Timestamp offset from session start
 * @param {boolean} isFinal - Whether this is a final transcript
 * @returns {Promise<object>} - Appended transcript entry
 */
async function appendTranscript(sessionId, userId, transcriptText, timestampOffsetMs, isFinal = true) {
  // Validate inputs
  if (!transcriptText || transcriptText.trim().length === 0) {
    throw new Error('Transcript text cannot be empty');
  }

  // Get buffer for this session
  let buffer = activeSessionBuffers.get(sessionId);
  if (!buffer) {
    // Re-initialize buffer if session exists
    const sessionExists = await verifySessionExists(sessionId, userId);
    if (!sessionExists) {
      throw new Error('Session not found or unauthorized');
    }
    buffer = {
      transcripts: [],
      lastCleanup: Date.now(),
      sequenceNumber: 0
    };
    activeSessionBuffers.set(sessionId, buffer);
  }

  // Increment sequence number
  buffer.sequenceNumber += 1;
  const sequenceNumber = buffer.sequenceNumber;

  const wordCount = transcriptText.trim().split(/\s+/).length;

  // Insert into database
  const query = `
    INSERT INTO live_lecture_transcripts 
    (session_id, user_id, transcript_text, sequence_number, timestamp_offset_ms, word_count, is_final)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, session_id, transcript_text, sequence_number, timestamp_offset_ms, word_count, is_final, created_at
  `;

  const result = await pool.query(query, [
    sessionId,
    userId,
    transcriptText,
    sequenceNumber,
    timestampOffsetMs,
    wordCount,
    isFinal
  ]);

  const transcript = result.rows[0];

  // Add to rolling buffer
  buffer.transcripts.push({
    text: transcriptText,
    timestamp: Date.now(),
    offsetMs: timestampOffsetMs,
    sequenceNumber
  });

  // Cleanup old entries from buffer (older than BUFFER_DURATION_MS)
  const now = Date.now();
  if (now - buffer.lastCleanup > 10000) { // Cleanup every 10 seconds
    buffer.transcripts = buffer.transcripts.filter(
      t => now - t.timestamp < BUFFER_DURATION_MS
    );
    buffer.lastCleanup = now;
  }

  // Update session word count in background (non-blocking)
  updateSessionWordCount(sessionId).catch(err => 
    console.error('Failed to update session word count:', err)
  );

  return transcript;
}

/**
 * Get rolling buffer for a session (last 60 seconds)
 * @param {string} sessionId - Session ID
 * @returns {Array<object>} - Recent transcript chunks
 */
function getRollingBuffer(sessionId) {
  const buffer = activeSessionBuffers.get(sessionId);
  if (!buffer) {
    return [];
  }

  const now = Date.now();
  return buffer.transcripts
    .filter(t => now - t.timestamp < BUFFER_DURATION_MS)
    .map(t => ({
      text: t.text,
      offsetMs: t.offsetMs,
      sequenceNumber: t.sequenceNumber
    }));
}

/**
 * Get full transcript for a session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<Array<object>>} - All transcript chunks in order
 */
async function getFullTranscript(sessionId, userId) {
  const query = `
    SELECT id, transcript_text, sequence_number, timestamp_offset_ms, word_count, is_final, created_at
    FROM live_lecture_transcripts
    WHERE session_id = $1 AND user_id = $2
    ORDER BY sequence_number ASC
  `;

  const result = await pool.query(query, [sessionId, userId]);
  return result.rows;
}

/**
 * End a live lecture session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Updated session
 */
async function endSession(sessionId, userId) {
  // Get all transcripts and build full transcript
  const transcripts = await getFullTranscript(sessionId, userId);
  const fullTranscript = transcripts.map(t => t.transcript_text).join(' ');
  const totalWordCount = transcripts.reduce((sum, t) => sum + (t.word_count || 0), 0);

  const query = `
    UPDATE live_lecture_sessions
    SET 
      ended_at = CURRENT_TIMESTAMP,
      duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER,
      full_transcript = $1,
      word_count = $2,
      processing_status = 'completed'
    WHERE id = $3 AND user_id = $4
    RETURNING id, user_id, title, started_at, ended_at, duration_seconds, word_count, processing_status
  `;

  const result = await pool.query(query, [fullTranscript, totalWordCount, sessionId, userId]);

  if (result.rows.length === 0) {
    throw new Error('Session not found or unauthorized');
  }

  // Clear buffer
  activeSessionBuffers.delete(sessionId);

  return result.rows[0];
}

/**
 * Get active session for user
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} - Active session or null
 */
async function getActiveSession(userId) {
  const query = `
    SELECT id, user_id, title, started_at, processing_status, word_count, created_at
    FROM live_lecture_sessions
    WHERE user_id = $1 AND processing_status = 'active'
    ORDER BY started_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} - Session or null
 */
async function getSession(sessionId, userId) {
  const query = `
    SELECT id, user_id, title, started_at, ended_at, duration_seconds, 
           word_count, processing_status, created_at
    FROM live_lecture_sessions
    WHERE id = $1 AND user_id = $2
  `;

  const result = await pool.query(query, [sessionId, userId]);
  return result.rows[0] || null;
}

/**
 * Get user's session history
 * @param {string} userId - User ID
 * @param {number} limit - Max sessions to return
 * @returns {Promise<Array<object>>} - Session list
 */
async function getUserSessions(userId, limit = 20) {
  const query = `
    SELECT id, user_id, title, started_at, ended_at, duration_seconds, 
           word_count, processing_status, created_at
    FROM live_lecture_sessions
    WHERE user_id = $1
    ORDER BY started_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [userId, limit]);
  return result.rows;
}

// Helper functions

async function verifySessionExists(sessionId, userId) {
  const query = `SELECT id FROM live_lecture_sessions WHERE id = $1 AND user_id = $2`;
  const result = await pool.query(query, [sessionId, userId]);
  return result.rows.length > 0;
}

async function updateSessionWordCount(sessionId) {
  const query = `
    UPDATE live_lecture_sessions
    SET word_count = (
      SELECT COALESCE(SUM(word_count), 0)
      FROM live_lecture_transcripts
      WHERE session_id = $1
    )
    WHERE id = $1
  `;
  await pool.query(query, [sessionId]);
}

function cleanupStaleBuffers() {
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  for (const [sessionId, buffer] of activeSessionBuffers.entries()) {
    if (buffer.lastCleanup < twoHoursAgo) {
      activeSessionBuffers.delete(sessionId);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupStaleBuffers, 30 * 60 * 1000);

module.exports = {
  createSession,
  appendTranscript,
  getRollingBuffer,
  getFullTranscript,
  endSession,
  getActiveSession,
  getSession,
  getUserSessions
};
