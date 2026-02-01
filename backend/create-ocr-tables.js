const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'studysage'
  // No password property - will use default (no auth)
});

async function createTables() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create OCR jobs table
    await client.query(`
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
    console.log('✅ document_ocr_jobs table created');

    // Create OCR results table
    await client.query(`
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
    console.log('✅ document_ocr_results table created');

    console.log('\n✅ All OCR tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTables();
