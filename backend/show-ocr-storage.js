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
    console.log('\n════════════════════════════════════════════════════════════\n');
    console.log('                    OCR DATA STORAGE LOCATION\n');
    console.log('════════════════════════════════════════════════════════════\n');

    // 1. Show OCR Jobs
    console.log('📋 OCR JOBS TABLE (document_ocr_jobs)\n');
    const jobs = await pool.query(
      `SELECT id, resource_id, status, total_pages, processed_pages, 
              duration_ms, created_at, completed_at
       FROM document_ocr_jobs 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    if (jobs.rows.length === 0) {
      console.log('  No OCR jobs found\n');
    } else {
      jobs.rows.forEach((job, idx) => {
        console.log(`  Job ${idx + 1}:`);
        console.log(`    ├─ Job ID: ${job.id}`);
        console.log(`    ├─ Resource ID: ${job.resource_id}`);
        console.log(`    ├─ Status: ${job.status}`);
        console.log(`    ├─ Pages: ${job.processed_pages}/${job.total_pages}`);
        console.log(`    ├─ Duration: ${job.duration_ms}ms`);
        console.log(`    ├─ Created: ${job.created_at}`);
        console.log(`    └─ Completed: ${job.completed_at}\n`);
      });
    }

    // 2. Show OCR Results
    console.log('📄 OCR RESULTS TABLE (document_ocr_results)\n');
    const results = await pool.query(
      `SELECT resource_id, page_number, extracted_text, char_count, 
              confidence_score, processing_error, created_at
       FROM document_ocr_results 
       ORDER BY created_at DESC 
       LIMIT 10`
    );

    if (results.rows.length === 0) {
      console.log('  No OCR results found\n');
    } else {
      results.rows.forEach((result, idx) => {
        console.log(`  Result ${idx + 1}:`);
        console.log(`    ├─ Resource ID: ${result.resource_id}`);
        console.log(`    ├─ Page: ${result.page_number}`);
        console.log(`    ├─ Text Length: ${result.char_count} chars`);
        console.log(`    ├─ Confidence: ${result.confidence_score}`);
        console.log(`    ├─ Text Preview: ${result.extracted_text ? result.extracted_text.substring(0, 60) + '...' : '(empty)'}`);
        console.log(`    ├─ Error: ${result.processing_error || 'None'}`);
        console.log(`    └─ Created: ${result.created_at}\n`);
      });
    }

    // 3. Show table schemas
    console.log('\n📊 TABLE SCHEMAS\n');
    console.log('document_ocr_jobs columns:');
    const jobSchema = await pool.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'document_ocr_jobs'
       ORDER BY ordinal_position`
    );
    jobSchema.rows.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : ''}`);
    });

    console.log('\ndocument_ocr_results columns:');
    const resultSchema = await pool.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'document_ocr_results'
       ORDER BY ordinal_position`
    );
    resultSchema.rows.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : ''}`);
    });

    console.log('\n════════════════════════════════════════════════════════════\n');
    console.log('✅ Database Location: PostgreSQL (localhost:5432)');
    console.log('✅ Database Name: studysage');
    console.log('✅ Tables: document_ocr_jobs, document_ocr_results');
    console.log('\n════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
