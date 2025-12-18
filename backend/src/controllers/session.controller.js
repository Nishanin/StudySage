const asyncHandler = require('../middlewares/asyncHandler');
const SessionService = require('../services/session.service');

const endSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const session = await SessionService.endSession(userId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'No active session found',
        statusCode: 404
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      session: {
        id: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        durationSeconds: session.durationSeconds,
        durationMinutes: Math.round(session.durationSeconds / 60)
      }
    }
  });
});

const getActiveSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const session = await SessionService.getActiveSession(userId);

  res.status(200).json({
    success: true,
    data: {
      session: session ? {
        id: session.id,
        resourceId: session.resourceId,
        sectionId: session.sectionId,
        startedAt: session.startedAt,
        estimatedDurationSeconds: SessionService.getSessionDurationEstimate(userId)
      } : null,
      hasActiveSession: session !== null
    }
  });
});

const getDurationEstimate = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const durationSeconds = SessionService.getSessionDurationEstimate(userId);

  res.status(200).json({
    success: true,
    data: {
      durationSeconds: durationSeconds,
      durationMinutes: durationSeconds ? Math.round(durationSeconds / 60) : null,
      hasActiveSession: durationSeconds !== null
    }
  });
});

const getSessionHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const daysBack = parseInt(req.query.daysBack || '7', 10);
  const limit = parseInt(req.query.limit || '50', 10);

  const sessions = await SessionService.getUserSessions(userId, daysBack, limit);

  // Calculate stats
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.endedAt).length;
  const totalDurationSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  res.status(200).json({
    success: true,
    data: {
      sessions: sessions.map(s => ({
        id: s.id,
        resourceId: s.resourceId,
        sectionId: s.sectionId,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        durationSeconds: s.durationSeconds,
        durationMinutes: s.durationSeconds ? Math.round(s.durationSeconds / 60) : null
      })),
      stats: {
        totalSessions,
        completedSessions,
        activeSessions: totalSessions - completedSessions,
        totalDurationSeconds,
        totalDurationMinutes: Math.round(totalDurationSeconds / 60),
        totalDurationHours: Math.round((totalDurationSeconds / 3600) * 10) / 10,
        averageDurationSeconds: completedSessions > 0 ? Math.round(totalDurationSeconds / completedSessions) : 0,
        averageDurationMinutes: completedSessions > 0 ? Math.round((totalDurationSeconds / completedSessions) / 60) : 0
      },
      daysRequested: daysBack
    }
  });
});

const getSessionConfig = asyncHandler(async (req, res) => {
  const inactivityTimeoutMs = SessionService.getInactivityTimeout();

  res.status(200).json({
    success: true,
    data: {
      config: {
        inactivityTimeoutSeconds: Math.round(inactivityTimeoutMs / 1000),
        inactivityTimeoutMinutes: Math.round(inactivityTimeoutMs / 60000),
        autoStartOnActivity: true,
        autoEndOnInactivity: true
      }
    }
  });
});

module.exports = {
  endSession,
  getActiveSession,
  getDurationEstimate,
  getSessionHistory,
  getSessionConfig
};
