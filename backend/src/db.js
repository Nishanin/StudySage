const { Pool } = require('pg');

// Build pool configuration from environment variables with sensible defaults
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'studysage',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS || '5000', 10)
};

const pool = new Pool(config);

async function testConnection() {
  const started = Date.now();
  try {
    const client = await pool.connect();
    client.release();
    const elapsed = Date.now() - started;
    console.log(
      `✅ PostgreSQL connected in ${elapsed}ms (host=${config.host} db=${config.database} user=${config.user})`
    );
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
