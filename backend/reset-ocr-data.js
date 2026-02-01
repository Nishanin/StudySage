require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Nishant124@#',
  database: process.env.DB_NAME || 'studysage'
});

(async () => {
  try {
    console.log('[RESET] Clearing old OCR test data...\n');

    // Get the resource ID we want to reprocess
    const resourceId = 'c0c21c89-a7d4-4d38-b5ae-eead83439bfc';

    // Delete old results
    const deleteResults = await pool.query(
      'DELETE FROM document_ocr_results WHERE resource_id = $1',
      [resourceId]
    );
    console.log(`✅ Deleted ${deleteResults.rowCount} old OCR results`);

    // Delete old jobs
    const deleteJobs = await pool.query(
      'DELETE FROM document_ocr_jobs WHERE resource_id = $1',
      [resourceId]
    );
    console.log(`✅ Deleted ${deleteJobs.rowCount} old OCR jobs`);

    // Check remaining data
    const jobCount = await pool.query(
      'SELECT COUNT(*) as cnt FROM document_ocr_jobs'
    );
    const resultCount = await pool.query(
      'SELECT COUNT(*) as cnt FROM document_ocr_results'
    );

    console.log(`\nRemaining OCR jobs: ${jobCount.rows[0].cnt}`);
    console.log(`Remaining OCR results: ${resultCount.rows[0].cnt}`);
    console.log('\n✅ Reset complete. Ready for fresh OCR test.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
