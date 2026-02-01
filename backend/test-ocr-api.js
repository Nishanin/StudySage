require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:5000/api';

(async () => {
  try {
    console.log('[TEST] Testing OCR API with file upload...\n');

    // Create a test PDF file (copy existing)
    const testPdfPath = 'uploads/c0c21c89-a7d4-4d38-b5ae-eead83439bfc.pdf';
    if (!fs.existsSync(testPdfPath)) {
      console.error('❌ Test PDF not found:', testPdfPath);
      process.exit(1);
    }

    // Upload via API
    console.log('[TEST] Step 1: Uploading PDF...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testPdfPath));
    formData.append('type', 'document');

    const uploadResponse = await axios.post(`${API_URL}/upload`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    const resourceId = uploadResponse.data.resource.id;
    console.log(`✅ PDF uploaded. Resource ID: ${resourceId}\n`);

    // Wait for OCR processing (polling)
    console.log('[TEST] Step 2: Waiting for OCR processing...');
    let jobId = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      const jobResponse = await axios.get(`${API_URL}/ocr/check-and-process/${resourceId}`, {
        timeout: 10000
      });

      if (jobResponse.data.job) {
        jobId = jobResponse.data.job.id;
        console.log(`  Job status: ${jobResponse.data.job.status}`);
        
        if (jobResponse.data.job.status === 'completed' || jobResponse.data.job.status === 'failed') {
          console.log(`✅ OCR processing complete\n`);
          break;
        }
      }

      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }

    if (!jobId) {
      console.error('❌ No OCR job found');
      process.exit(1);
    }

    // Get results
    console.log('[TEST] Step 3: Retrieving OCR results...');
    const resultsResponse = await axios.get(`${API_URL}/ocr/results/${jobId}`, {
      timeout: 10000
    });

    const results = resultsResponse.data.results;
    console.log(`\n✅ OCR Results Retrieved:\n`);
    
    results.forEach(result => {
      console.log(`  Page ${result.page_number}:`);
      console.log(`    ├─ Text Length: ${result.extracted_text ? result.extracted_text.length : 0} chars`);
      console.log(`    ├─ Char Count (DB): ${result.char_count}`);
      console.log(`    ├─ Confidence: ${result.confidence_score}`);
      if (result.processing_error) {
        console.log(`    └─ Error: ${result.processing_error}`);
      } else if (result.extracted_text) {
        console.log(`    └─ Text Preview: ${result.extracted_text.substring(0, 60)}...`);
      }
    });

    console.log(`\n========================================`);
    if (results.some(r => r.extracted_text && r.extracted_text.length > 0)) {
      console.log(`✅ SUCCESS: OCR extracted real text!`);
    } else if (results.every(r => r.extracted_text === '')) {
      console.log(`⚠️  INFO: PDF has no visible text to extract`);
      console.log(`   (This is expected for blank PDFs)`);
    }
    console.log(`========================================`);

    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response?.data) {
      console.error('Response:', err.response.data);
    }
    process.exit(1);
  }
})();
