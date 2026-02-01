const OCRService = require('./src/services/ocr.service');
const fs = require('fs');

(async () => {
  try {
    const buf = fs.readFileSync('uploads/c0c21c89-a7d4-4d38-b5ae-eead83439bfc.pdf');
    console.log('[TEST] Starting OCR extraction...\n');
    
    const results = await OCRService.extractTextFromScannedPdf(buf, { maxPages: 1 });
    
    console.log('\n✅ OCR Completed:\n');
    results.forEach(res => {
      console.log(`  Page ${res.pageNumber}:`);
      console.log(`    ├─ Characters: ${res.charCount}`);
      console.log(`    ├─ Confidence: ${res.confidenceScore.toFixed(2)}`);
      console.log(`    ├─ Duration: ${res.duration}ms`);
      if (res.error) {
        console.log(`    └─ Error: ${res.error}`);
      } else if (res.text) {
        console.log(`    └─ Sample text: ${res.text.substring(0, 80)}...`);
      }
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
