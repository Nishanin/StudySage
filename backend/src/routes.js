const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./routes/auth.routes');
const uploadRoutes = require('./routes/upload.routes');
const contentRoutes = require('./routes/content.routes');
const contextRoutes = require('./routes/context.routes');
const sessionRoutes = require('./routes/session.routes');
const chatRoutes = require('./routes/chat.routes');
const liveLectureRoutes = require('./routes/liveLecture.routes');
const learningRoutes = require('./routes/learning.routes');
const flashcardsRoutes = require('./routes/flashcards.routes');
const quizzesRoutes = require('./routes/quizzes.routes');
const notesRoutes = require('./routes/notes.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/content', contentRoutes);
router.use('/context', contextRoutes);
router.use('/session', sessionRoutes);
router.use('/chat', chatRoutes);
router.use('/live-lecture', liveLectureRoutes);
router.use('/learning', learningRoutes);
router.use('/flashcards', flashcardsRoutes);
router.use('/quizzes', quizzesRoutes);
router.use('/notes', notesRoutes);

// API status endpoint
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler for undefined API routes
router.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
      statusCode: 404
    }
  });
});

module.exports = router;
