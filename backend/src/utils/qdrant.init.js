const QdrantService = require('../services/qdrant.service');

async function initializeQdrant() {
  try {
    console.log('[Qdrant Init] Starting Qdrant initialization...');

    // Verify Qdrant connection
    const health = await QdrantService.healthCheck();

    if (!health.healthy) {
      console.error('[Qdrant Init] ❌ Qdrant is not healthy:', health.error);
      console.error('[Qdrant Init] Make sure QDRANT_URL and QDRANT_API_KEY are set correctly');
      throw new Error('Qdrant health check failed');
    }

    console.log('[Qdrant Init] ✅ Qdrant connection healthy');

    // Initialize collection
    const result = await QdrantService.initializeCollection();

    console.log('[Qdrant Init] ✅ Collection initialized:', result);

    // Get collection stats
    const stats = await QdrantService.getCollectionStats();

    console.log('[Qdrant Init] ✅ Collection stats:', {
      name: stats.name,
      points: stats.pointsCount,
      vectorSize: stats.vectorSize,
      distance: stats.distanceMetric
    });

    return {
      success: true,
      message: 'Qdrant initialized successfully'
    };
  } catch (error) {
    console.error('[Qdrant Init] ❌ Initialization failed:', error.message);
    throw error;
  }
}

async function shutdownQdrant() {
  try {
    console.log('[Qdrant Shutdown] Closing Qdrant connection...');
    // Qdrant client doesn't need explicit shutdown for REST
    console.log('[Qdrant Shutdown] ✅ Connection closed');
  } catch (error) {
    console.error('[Qdrant Shutdown] Error:', error);
  }
}

module.exports = {
  initializeQdrant,
  shutdownQdrant
};
