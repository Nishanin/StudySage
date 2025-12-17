const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./routes/auth.routes');
const uploadRoutes = require('./routes/upload.routes');
const contentRoutes = require('./routes/content.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/content', contentRoutes);

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
