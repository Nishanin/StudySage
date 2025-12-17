const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

const liveContextStore = new Map();

class ContextService {
  static async updateContext(userId, resourceId, position = {}) {
    try {
      const now = new Date();
      
      if (!userId || !resourceId) {
        throw new Error('userId and resourceId are required');
      }

      const context = {
        resourceId,
        pageNumber: position.pageNumber || null,
        timestampSeconds: position.timestampSeconds || null,
        metadata: position.metadata || {},
        lastActivityAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      liveContextStore.set(userId, context);

      this._persistContextAsync(userId, context).catch(error => {
        console.error(`Failed to persist context for user ${userId}:`, error);
      });

      return context;
    } catch (error) {
      console.error('Context update error:', error);
      throw error;
    }
  }

  static async getCurrentContext(userId) {
    try {
      if (liveContextStore.has(userId)) {
        return liveContextStore.get(userId);
      }

      const query = `
        SELECT resource_id, current_page, current_timestamp_seconds, 
               current_view_metadata, last_activity_at, updated_at
        FROM study_contexts
        WHERE user_id = $1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const context = {
        resourceId: row.resource_id,
        pageNumber: row.current_page,
        timestampSeconds: row.current_timestamp_seconds,
        metadata: row.current_view_metadata || {},
        lastActivityAt: row.last_activity_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };

      liveContextStore.set(userId, context);

      return context;
    } catch (error) {
      console.error('Get context error:', error);
      throw error;
    }
  }

  static async _persistContextAsync(userId, context) {
    try {
      const query = `
        INSERT INTO study_contexts 
          (user_id, resource_id, current_page, current_timestamp_seconds, 
           current_view_metadata, last_activity_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE SET
          resource_id = EXCLUDED.resource_id,
          current_page = EXCLUDED.current_page,
          current_timestamp_seconds = EXCLUDED.current_timestamp_seconds,
          current_view_metadata = EXCLUDED.current_view_metadata,
          last_activity_at = EXCLUDED.last_activity_at,
          updated_at = CURRENT_TIMESTAMP
      `;

      await pool.query(query, [
        userId,
        context.resourceId,
        context.pageNumber || null,
        context.timestampSeconds || null,
        JSON.stringify(context.metadata),
        new Date(context.lastActivityAt)
      ]);
    } catch (error) {
      console.error('Failed to persist context:', error);
      throw error;
    }
  }

  static async clearContext(userId) {
    try {
      liveContextStore.delete(userId);

      const query = `
        DELETE FROM study_contexts WHERE user_id = $1
      `;

      await pool.query(query, [userId]);
    } catch (error) {
      console.error('Clear context error:', error);
      throw error;
    }
  }

  static getAllLiveContexts() {
    const contexts = {};
    
    for (const [userId, context] of liveContextStore.entries()) {
      contexts[userId] = context;
    }

    return contexts;
  }

  static hasActiveContext(userId) {
    return liveContextStore.has(userId);
  }

  static getContextAge(userId) {
    if (!liveContextStore.has(userId)) {
      return null;
    }

    const context = liveContextStore.get(userId);
    const lastActivity = new Date(context.lastActivityAt);
    return Date.now() - lastActivity.getTime();
  }
}

module.exports = ContextService;
