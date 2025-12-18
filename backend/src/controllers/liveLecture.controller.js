const liveLectureService = require('../services/liveLecture.service');
const { asyncHandler } = require('../middlewares');

const startSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { title } = req.body;

  console.log('[LiveLecture Controller] Start session request - userId:', userId, 'title:', title);

  const existingSession = await liveLectureService.getActiveSession(userId);
  if (existingSession) {
    console.log('[LiveLecture Controller] Returning existing session:', existingSession.id);
    return res.status(200).json({
      success: true,
      message: 'Active session already exists',
      data: {
        session: existingSession
      }
    });
  }

  const session = await liveLectureService.createSession(userId, title);

  console.log('[LiveLecture Controller] Session created successfully:', session.id);

  res.status(201).json({
    success: true,
    message: 'Live lecture session created',
    data: {
      session: {
        id: session.id,
        userId: session.user_id,
        title: session.title,
        startedAt: session.started_at,
        processingStatus: session.processing_status
      }
    }
  });
});

const appendTranscript = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId, transcriptText, timestampOffsetMs, isFinal } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'sessionId is required',
        statusCode: 400
      }
    });
  }

  if (!transcriptText || typeof transcriptText !== 'string' || transcriptText.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'transcriptText must be a non-empty string',
        statusCode: 400
      }
    });
  }

  if (typeof timestampOffsetMs !== 'number' || timestampOffsetMs < 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'timestampOffsetMs must be a non-negative number',
        statusCode: 400
      }
    });
  }

  const transcript = await liveLectureService.appendTranscript(
    sessionId,
    userId,
    transcriptText,
    timestampOffsetMs,
    isFinal !== false // Default to true
  );

  const rollingBuffer = liveLectureService.getRollingBuffer(sessionId);

  res.status(200).json({
    success: true,
    data: {
      transcript: {
        id: transcript.id,
        sequenceNumber: transcript.sequence_number,
        wordCount: transcript.word_count,
        createdAt: transcript.created_at
      },
      rollingBuffer: {
        chunks: rollingBuffer.length,
        totalWords: rollingBuffer.reduce((sum, chunk) => 
          sum + chunk.text.split(/\s+/).length, 0
        )
      }
    }
  });
});

const getRollingBuffer = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  const session = await liveLectureService.getSession(sessionId, userId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Session not found',
        statusCode: 404
      }
    });
  }

  const buffer = liveLectureService.getRollingBuffer(sessionId);

  res.status(200).json({
    success: true,
    data: {
      sessionId,
      buffer,
      chunks: buffer.length,
      totalWords: buffer.reduce((sum, chunk) => 
        sum + chunk.text.split(/\s+/).length, 0
      )
    }
  });
});

const getFullTranscript = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  const transcripts = await liveLectureService.getFullTranscript(sessionId, userId);

  if (transcripts.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'No transcripts found for this session',
        statusCode: 404
      }
    });
  }

  const fullText = transcripts.map(t => t.transcript_text).join(' ');

  res.status(200).json({
    success: true,
    data: {
      sessionId,
      fullTranscript: fullText,
      chunks: transcripts.map(t => ({
        id: t.id,
        text: t.transcript_text,
        sequenceNumber: t.sequence_number,
        timestampOffsetMs: t.timestamp_offset_ms,
        wordCount: t.word_count,
        isFinal: t.is_final,
        createdAt: t.created_at
      })),
      totalChunks: transcripts.length,
      totalWords: transcripts.reduce((sum, t) => sum + (t.word_count || 0), 0)
    }
  });
});

const endSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  const session = await liveLectureService.endSession(sessionId, userId);

  res.status(200).json({
    success: true,
    message: 'Live lecture session ended',
    data: {
      session: {
        id: session.id,
        userId: session.user_id,
        title: session.title,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        durationSeconds: session.duration_seconds,
        wordCount: session.word_count,
        processingStatus: session.processing_status
      }
    }
  });
});

const getActiveSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const session = await liveLectureService.getActiveSession(userId);

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
        userId: session.user_id,
        title: session.title,
        startedAt: session.started_at,
        wordCount: session.word_count,
        processingStatus: session.processing_status
      }
    }
  });
});

const getSessions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 20;

  const sessions = await liveLectureService.getUserSessions(userId, Math.min(limit, 100));

  res.status(200).json({
    success: true,
    data: {
      sessions: sessions.map(s => ({
        id: s.id,
        userId: s.user_id,
        title: s.title,
        startedAt: s.started_at,
        endedAt: s.ended_at,
        durationSeconds: s.duration_seconds,
        wordCount: s.word_count,
        processingStatus: s.processing_status,
        createdAt: s.created_at
      })),
      total: sessions.length
    }
  });
});

module.exports = {
  startSession,
  appendTranscript,
  getRollingBuffer,
  getFullTranscript,
  endSession,
  getActiveSession,
  getSessions
};
