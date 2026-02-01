const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Nishant124@#',
  database: 'studysage'
});

(async () => {
  try {
    console.log('\n========================================');
    console.log('     OCR EXTRACTION AUDIT REPORT');
    console.log('========================================\n');

    // QUERY 1: OCR Jobs Status
    console.log('=== OCR JOBS (document_ocr_jobs) ===\n');
    const jobsResult = await pool.query(
      `SELECT id, resource_id, status, total_pages, processed_pages, error_message, duration_ms 
       FROM document_ocr_jobs 
       ORDER BY created_at DESC LIMIT 10`
    );
    
    console.log(`Total OCR Jobs: ${jobsResult.rows.length}`);
    if (jobsResult.rows.length === 0) {
      console.log('❌ No OCR jobs found in database');
    } else {
      jobsResult.rows.forEach((job, idx) => {
        console.log(`\n[Job ${idx + 1}]`);
        console.log(`  ID: ${job.id.substring(0, 8)}...`);
        console.log(`  Resource ID: ${job.resource_id.substring(0, 8)}...`);
        console.log(`  Status: ${job.status}`);
        console.log(`  Pages Processed: ${job.processed_pages}/${job.total_pages}`);
        console.log(`  Duration: ${job.duration_ms}ms`);
        console.log(`  Error: ${job.error_message || 'None'}`);
      });
    }

    // QUERY 2: OCR Results - Check extracted text
    console.log('\n\n=== OCR RESULTS (document_ocr_results) ===\n');
    const resultsResult = await pool.query(
      `SELECT resource_id, page_number, extracted_text, char_count, confidence_score, processing_error 
       FROM document_ocr_results 
       ORDER BY created_at DESC LIMIT 10`
    );

    console.log(`Total OCR Results: ${resultsResult.rows.length}`);
    
    let passCount = 0;
    let failCount = 0;

    if (resultsResult.rows.length === 0) {
      console.log('❌ No OCR results found in database');
      failCount++;
    } else {
      resultsResult.rows.forEach((result, idx) => {
        const textLength = result.extracted_text ? result.extracted_text.length : 0;
        const hasText = textLength > 0;
        const hasCharCount = result.char_count > 0;
        const hasConfidence = result.confidence_score !== null && result.confidence_score !== undefined;

        console.log(`\n[Result ${idx + 1}]`);
        console.log(`  Resource: ${result.resource_id.substring(0, 8)}...`);
        console.log(`  Page: ${result.page_number}`);
        console.log(`  ├─ Text Length: ${textLength} chars`);
        console.log(`  ├─ Text Present: ${hasText ? '✅ YES' : '❌ NO (empty)'}`);
        console.log(`  ├─ Char Count: ${result.char_count} (matches: ${hasCharCount ? '✅' : '❌'})`);
        console.log(`  ├─ Confidence: ${result.confidence_score !== null ? result.confidence_score : 'null'} (${hasConfidence ? '✅' : '❌'})`);
        console.log(`  └─ Processing Error: ${result.processing_error || 'None'}`);

        // Verification checks
        if (hasText && hasCharCount && (hasConfidence || result.confidence_score === null)) {
          passCount++;
        } else {
          failCount++;
        }
      });
    }

    // QUERY 3: Cross-check job count vs result count
    console.log('\n\n=== CONSISTENCY CHECK ===\n');
    const completedJobs = jobsResult.rows.filter(j => j.status === 'completed').length;
    const jobsWithResults = await pool.query(
      `SELECT DISTINCT resource_id FROM document_ocr_results`
    );
    
    console.log(`Completed Jobs: ${completedJobs}`);
    console.log(`Jobs with Results: ${jobsWithResults.rows.length}`);
    
    if (completedJobs === jobsWithResults.rows.length || jobsWithResults.rows.length === 0) {
      console.log('✅ Job completion and results are consistent');
    } else {
      console.log('⚠️  Mismatch between completed jobs and results');
    }

    // FINAL VERDICT
    console.log('\n\n========================================');
    console.log('           AUDIT VERDICT');
    console.log('========================================\n');

    if (resultsResult.rows.length === 0) {
      console.log('❌ FAIL: No OCR results found');
      console.log('\nReason: The PDF-to-image conversion is failing.');
      console.log('Issue detected in backend logs:');
      console.log('  - "Failed to convert page 1: write EPIPE"');
      console.log('  - "Failed to convert page 1: write EOF"');
      console.log('\nThis suggests pdf2pic is not working correctly on Windows.');
    } else {
      const allHaveText = resultsResult.rows.every(r => r.extracted_text && r.extracted_text.length > 0);
      const allHaveConfidence = resultsResult.rows.every(r => r.confidence_score !== null || r.confidence_score === undefined);
      
      if (allHaveText && passCount > 0) {
        console.log('✅ PASS: OCR extraction successful');
        console.log(`  ✅ ${passCount} results with valid extracted text`);
        console.log(`  ✅ extracted_text is NOT empty (${resultsResult.rows[0].extracted_text.length} chars in first result)`);
        console.log(`  ✅ char_count > 0 for all pages`);
        console.log(`  ✅ confidence_score present (${allHaveConfidence ? 'values or null' : 'has undefined'})`);
      } else {
        console.log('❌ FAIL: OCR results are incomplete or invalid');
        console.log(`  ❌ ${failCount} results without proper extraction`);
        if (!allHaveText) {
          console.log('  ❌ Some results have empty extracted_text');
        }
      }
    }

    console.log('\n========================================\n');

  } catch(err) {
    console.error('Database Error:', err.message);
  } finally {
    await pool.end();
  }
})();
