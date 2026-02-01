const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

(async () => {
  try {
    console.log('[TEST] Starting Tesseract diagnostics...\n');

    // Step 1: Convert PDF to image
    console.log('[TEST] Step 1: Converting PDF to image with ImageMagick...');
    const tempDir = path.join(os.tmpdir(), `ocr-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const pdfPath = 'uploads/c0c21c89-a7d4-4d38-b5ae-eead83439bfc.pdf';
    const outputPattern = path.join(tempDir, 'page-%d.png');

    const magick = spawn('magick', [pdfPath, '-density', '150', '-quality', '85', outputPattern]);

    await new Promise((resolve, reject) => {
      magick.on('close', (code) => {
        if (code === 0) {
          console.log('✅ ImageMagick conversion successful\n');
          resolve();
        } else {
          reject(new Error('ImageMagick failed'));
        }
      });
      magick.on('error', reject);
    });

    // Step 2: List created images
    const images = fs.readdirSync(tempDir).filter(f => f.endsWith('.png'));
    console.log(`[TEST] Created ${images.length} PNG files:`);
    images.forEach(img => {
      const fullPath = path.join(tempDir, img);
      const size = fs.statSync(fullPath).size;
      console.log(`  - ${img} (${size} bytes)`);
    });

    // Step 3: Test Tesseract on first image
    if (images.length > 0) {
      const imagePath = path.join(tempDir, images[0]);
      console.log(`\n[TEST] Step 2: Running Tesseract on ${images[0]}...`);

      const worker = await Tesseract.createWorker();
      console.log('[TEST] Worker created');

      const { data } = await worker.recognize(imagePath);
      console.log('[TEST] Tesseract recognition completed\n');

      console.log('[TEST] Full data object:');
      console.log(JSON.stringify(data, null, 2));

      await worker.terminate();

      // Step 4: Check actual file content
      console.log(`\n[TEST] Step 3: Checking image file directly...`);
      const stats = fs.statSync(imagePath);
      console.log(`  Image size: ${stats.size} bytes`);
      console.log(`  Image path: ${imagePath}`);
      console.log(`  Image exists: ${fs.existsSync(imagePath)}`);
    }

    // Cleanup
    fs.rmSync(tempDir, { recursive: true });
    console.log('\n[TEST] Cleaned up temp files');
    console.log('[TEST] Diagnostics complete');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
