const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

// Configuration
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const activeSessions = new Map();

class SessionService {
  static async startSession(userId, resourceId, sectionId = null, metadata = {}) {
    try {
      const sessionId = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO study_sessions 
          (id, user_id, resource_id, section_id, started_at, session_metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, started_at
      `;

      const result = await pool.query(query, [
        sessionId,
        userId,
        resourceId || null,
        sectionId || null,
        now,
        JSON.stringify({
          ...metadata,
          createdBy: 'auto-start-on-activity'
        })
      ]);

      activeSessions.set(userId, {
        id: sessionId,
        resourceId,
        sectionId,
        startedAt: now.toISOString(),
        lastActivityAt: now.toISOString(),
        metadata
      });

      console.log(`✅ Session started: ${sessionId} for user ${userId}`);

      return {
        id: sessionId,
        startedAt: result.rows[0].started_at.toISOString()
      };
    } catch (error) {
      console.error('Session start error:', error);
      throw error;
    }
  }

  static async updateSessionActivity(userId, resourceId, sectionId = null) {
    try {
      const now = Date.now();

      if (!activeSessions.has(userId)) {
        // No active session, auto-start one
        return await this.startSession(userId, resourceId, sectionId);
      }

      const session = activeSessions.get(userId);
      const lastActivityTime = new Date(session.lastActivityAt).getTime();
      const inactivityDuration = now - lastActivityTime;

      // Check if session has timed out
      if (inactivityDuration > INACTIVITY_TIMEOUT_MS) {
        // Session timed out, end it and start new one
        await this.endSession(userId, session.id);
        return await this.startSession(userId, resourceId, sectionId);
      }

      // Session still active, update last activity
      session.lastActivityAt = new Date(now).toISOString();
      session.resourceId = resourceId; // Update resource in case user switched
      session.sectionId = sectionId; // Update section

      activeSessions.set(userId, session);

      return session;
    } catch (error) {
      console.error('Session activity update error:', error);
      throw error;
    }
  }

  static async endSession(userId, sessionId = null) {
    try {
      // Get session from memory
      let session = activeSessions.get(userId);

      if (!session) {
        // Session not in memory, fetch from DB
        const query = `
          SELECT id, started_at, ended_at
          FROM study_sessions
          WHERE user_id = $1 AND ended_at IS NULL
          ORDER BY started_at DESC
          LIMIT 1
        `;

        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
          console.warn(`No active session found for user ${userId}`);
          return null;
        }

        session = {
          id: result.rows[0].id,
          startedAt: result.rows[0].started_at.toISOString()
        };
      }

      // Use provided sessionId or get from session object
      const finalSessionId = sessionId || session.id;
      const startTime = new Date(session.startedAt || session.started_at);
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      // Update database
      const updateQuery = `
        UPDATE study_sessions
        SET ended_at = $1, duration_seconds = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, user_id, resource_id, section_id, started_at, ended_at, duration_seconds
      `;

      const result = await pool.query(updateQuery, [
        endTime,
        durationSeconds,
        finalSessionId
      ]);

      // Remove from memory
      activeSessions.delete(userId);

      const sessionRecord = result.rows[0];

      console.log(`✅ Session ended: ${finalSessionId} | Duration: ${durationSeconds}s (${Math.floor(durationSeconds / 60)}m)`);

      return {
        id: sessionRecord.id,
        startedAt: sessionRecord.started_at.toISOString(),
        endedAt: sessionRecord.ended_at.toISOString(),
        durationSeconds: sessionRecord.duration_seconds
      };
    } catch (error) {
      console.error('Session end error:', error);
      throw error;
    }
  }

  static async getActiveSession(userId) {
    try {
      if (activeSessions.has(userId)) {
        return activeSessions.get(userId);
      }

      // Check database for most recent unclosed session
      const query = `
        SELECT id, user_id, resource_id, section_id, started_at
        FROM study_sessions
        WHERE user_id = $1 AND ended_at IS NULL
        ORDER BY started_at DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        resourceId: row.resource_id,
        sectionId: row.section_id,
        startedAt: row.started_at.toISOString()
      };
    } catch (error) {
      console.error('Get active session error:', error);
      throw error;
    }
  }

  static getSessionDurationEstimate(userId) {
    try {
      if (!activeSessions.has(userId)) {
        return null;
      }

      const session = activeSessions.get(userId);
      const startTime = new Date(session.startedAt);
      const now = new Date();
      const durationSeconds = Math.floor((now - startTime) / 1000);

      return durationSeconds;
    } catch (error) {
      console.error('Get duration estimate error:', error);
      return null;
    }
  }

  static getAllActiveSessions() {
    const sessions = {};

    for (const [userId, session] of activeSessions.entries()) {
      const durationSeconds = this.getSessionDurationEstimate(userId);
      sessions[userId] = {
        ...session,
        estimatedDurationSeconds: durationSeconds
      };
    }

    return sessions;
  }

  static hasActiveSession(userId) {
    return activeSessions.has(userId);
  }

  static async getUserSessions(userId, daysBack = 7, limit = 50) {
    try {
      const query = `
        SELECT id, resource_id, section_id, started_at, ended_at, duration_seconds, session_metadata
        FROM study_sessions
        WHERE user_id = $1 
          AND created_at >= NOW() - INTERVAL '1 day' * $2
        ORDER BY started_at DESC
        LIMIT $3
      `;

      const result = await pool.query(query, [userId, daysBack, limit]);

      return result.rows.map(row => ({
        id: row.id,
        resourceId: row.resource_id,
        sectionId: row.section_id,
        startedAt: row.started_at.toISOString(),
        endedAt: row.ended_at ? row.ended_at.toISOString() : null,
        durationSeconds: row.duration_seconds,
        metadata: row.session_metadata
      }));
    } catch (error) {
      console.error('Get user sessions error:', error);
      throw error;
    }
  }

  static async cleanupStaleSessions() {
    try {
      const staleSessionIds = [];

      for (const [userId, session] of activeSessions.entries()) {
        const lastActivityTime = new Date(session.lastActivityAt).getTime();
        const inactivityDuration = Date.now() - lastActivityTime;

        if (inactivityDuration > INACTIVITY_TIMEOUT_MS) {
          staleSessionIds.push({ userId, sessionId: session.id });
        }
      }

      // End all stale sessions
      for (const { userId, sessionId } of staleSessionIds) {
        await this.endSession(userId, sessionId);
      }

      if (staleSessionIds.length > 0) {
        console.log(`🧹 Cleaned up ${staleSessionIds.length} stale sessions`);
      }

      return staleSessionIds.length;
    } catch (error) {
      console.error('Cleanup stale sessions error:', error);
      throw error;
    }
  }

  static getInactivityTimeout() {
    return INACTIVITY_TIMEOUT_MS;
  }
}

module.exports = SessionService;
