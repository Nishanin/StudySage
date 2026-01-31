const { pool } = require('./db');

/**
 * Initialize OCR tables if they don't exist
 * This runs on backend startup
 */
async function initializeOcrTables() {
  try {
    console.log('[DB Init] Initializing OCR tables...');

    // Create document_ocr_jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_ocr_jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        resource_id UUID NOT NULL,
        user_id UUID NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        total_pages INTEGER,
        processed_pages INTEGER DEFAULT 0,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        duration_ms INTEGER,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        ocr_engine VARCHAR(50) DEFAULT 'paddleocr',
        ocr_language VARCHAR(10) DEFAULT 'en',
        timeout_ms INTEGER DEFAULT 300000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB Init] ✅ document_ocr_jobs table ready');

    // Create document_ocr_results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_ocr_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        resource_id UUID NOT NULL,
        user_id UUID NOT NULL,
        page_number INTEGER NOT NULL,
        extracted_text TEXT NOT NULL,
        char_count INTEGER DEFAULT 0,
        ocr_engine VARCHAR(50) DEFAULT 'paddleocr',
        ocr_language VARCHAR(10) DEFAULT 'en',
        confidence_score DECIMAL(3, 2) DEFAULT 0.0,
        processing_duration_ms INTEGER,
        processing_error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB Init] ✅ document_ocr_results table ready');

    // Create indexes for OCR tables
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_document_ocr_jobs_resource_id 
      ON document_ocr_jobs(resource_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_document_ocr_results_resource_id 
      ON document_ocr_results(resource_id)
    `);

    // Add OCR columns to study_resources table if they don't exist
    await pool.query(`
      ALTER TABLE study_resources
      ADD COLUMN IF NOT EXISTS is_scanned_pdf BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ocr_completed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ocr_text TEXT,
      ADD COLUMN IF NOT EXISTS ocr_job_id UUID REFERENCES document_ocr_jobs(id) ON DELETE SET NULL
    `);
    console.log('[DB Init] ✅ study_resources OCR columns added');

    // Create indexes for OCR columns on study_resources
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_study_resources_ocr_completed 
      ON study_resources(ocr_completed) 
      WHERE resource_type = 'pdf'
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_study_resources_is_scanned 
      ON study_resources(is_scanned_pdf) 
      WHERE resource_type = 'pdf'
    `);

    console.log('[DB Init] ✅ All OCR tables and indexes initialized');
    return true;
  } catch (err) {
    console.error('[DB Init] ❌ Error initializing OCR tables:', err.message);
    return false;
  }
}

module.exports = { initializeOcrTables };
