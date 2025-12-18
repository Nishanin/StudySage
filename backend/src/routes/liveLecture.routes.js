const express = require('express');
const router = express.Router();
const liveLectureController = require('../controllers/liveLecture.controller');
const { authenticate } = require('../middlewares');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /live-lecture/start
 * @desc    Start a new live lecture session
 * @access  Private
 * @body    { title?: string }
 * @returns { session: { id, userId, title, startedAt, processingStatus } }
 */
router.post('/start', liveLectureController.startSession);

/**
 * @route   POST /live-lecture/transcript
 * @desc    Append transcript chunk to active session
 * @access  Private
 * @body    { sessionId: string, transcriptText: string, timestampOffsetMs: number, isFinal?: boolean }
 * @returns { transcript: { id, sequenceNumber, wordCount }, rollingBuffer: { chunks, totalWords } }
 */
router.post('/transcript', liveLectureController.appendTranscript);

/**
 * @route   GET /live-lecture/active
 * @desc    Get active live lecture session for current user
 * @access  Private
 * @returns { session: { id, userId, title, startedAt, wordCount, processingStatus } }
 */
router.get('/active', liveLectureController.getActiveSession);

/**
 * @route   GET /live-lecture/sessions
 * @desc    Get session history for current user
 * @access  Private
 * @query   { limit?: number }
 * @returns { sessions: Array, total: number }
 */
router.get('/sessions', liveLectureController.getSessions);

/**
 * @route   GET /live-lecture/buffer/:sessionId
 * @desc    Get rolling buffer (last 60s) for a session
 * @access  Private
 * @returns { sessionId, buffer: Array, chunks, totalWords }
 */
router.get('/buffer/:sessionId', liveLectureController.getRollingBuffer);

/**
 * @route   GET /live-lecture/:sessionId/transcript
 * @desc    Get full transcript for a session
 * @access  Private
 * @returns { sessionId, fullTranscript, chunks: Array, totalChunks, totalWords }
 */
router.get('/:sessionId/transcript', liveLectureController.getFullTranscript);

/**
 * @route   POST /live-lecture/:sessionId/end
 * @desc    End a live lecture session
 * @access  Private
 * @returns { session: { id, userId, title, startedAt, endedAt, durationSeconds, wordCount } }
 */
router.post('/:sessionId/end', liveLectureController.endSession);

module.exports = router;
