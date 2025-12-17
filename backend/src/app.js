const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

// Import middleware
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');
const requestLogger = require('./middlewares/requestLogger');

// Import routes
const routes = require('./routes');

// Create Express app
const app = express();

// Trust proxy (for deployment behind reverse proxies like Nginx)
app.set('trust proxy', 1);

// Helmet: Set security-related HTTP headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS: Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON payloads (limit: 10mb for file metadata)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compress response bodies
app.use(compression());

// HTTP request logger (Morgan)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Custom request logger
app.use(requestLogger);

// Serve uploaded files as static content
const path = require('path');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// Mount all routes
app.use('/api', routes);

// Health check endpoint (no /api prefix)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'AI Study Companion API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
