require('dotenv').config();
const app = require('./app');
const { testConnection: testDbConnection } = require('./db');
const { testConnection: testQdrantConnection, ensureCollection } = require('./qdrant.client');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

const startServer = () => {
  try {
    server = app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`🚀 Server running in ${NODE_ENV} mode`);
      console.log(`📡 Listening on port ${PORT}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log('='.repeat(60));
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      console.log('👋 Process terminated gracefully');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('⚠️  Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(error.name, error.message);
  console.error(error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Verify DB and Qdrant connections on startup (non-fatal if they fail)
(async () => {
  await testDbConnection();
  
  const qdrantConnected = await testQdrantConnection();
  if (qdrantConnected) {
    await ensureCollection();
  }
  
  startServer();
})();

module.exports = server;
