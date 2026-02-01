const { PDFParse } = require('pdf-parse');
const fs = require('fs');

(async () => {
  try {
    const buf = fs.readFileSync('uploads/c0c21c89-a7d4-4d38-b5ae-eead83439bfc.pdf');
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();

    console.log('[PDF ANALYSIS]');
    console.log('Total pages:', result.total);
    console.log('Extracted text length:', result.text.length);
    console.log('Text content (first 200 chars):');
    console.log(result.text.substring(0, 200));
    console.log('---');
    console.log('Text content (last 200 chars):');
    console.log(result.text.substring(result.text.length - 200));

    if (result.text.trim().length > 0) {
      console.log('\n✅ This PDF has EMBEDDED TEXT - it is NOT a scanned PDF');
      console.log('   The text layer can be extracted directly without OCR');
    } else {
      console.log('\n❌ This PDF has NO embedded text - it IS a scanned PDF');
      console.log('   OCR is needed, but image conversion may need adjustment');
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
