const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
let PDFParse;

try {
  // pdf-parse v2+ exports PDFParse class
  const pdfParseModule = require('pdf-parse');
  PDFParse = pdfParseModule.PDFParse || pdfParseModule.default?.PDFParse;
  
  if (!PDFParse) {
    throw new Error('PDFParse class not found in pdf-parse module');
  }
} catch (err) {
  console.error('[OCR] Failed to load pdf-parse:', err.message);
  PDFParse = null;
}

/**
 * OCR Service - Handles text extraction from scanned PDFs
 * 
 * IMPLEMENTATION NOTE:
 * This service provides a framework for OCR processing. In production:
 * 1. For PaddleOCR: Install paddleocr-python and use child_process to call Python
 * 2. For Tesseract: Install tesseract.js for browser OCR or tesseract for Node.js
 * 3. For cloud-based: Integrate Google Cloud Vision or AWS Textract
 * 
 * For now, this service:
 * - Detects if PDF has text layer (already extractable)
 * - Provides framework for OCR integration
 * - Stores OCR job metadata
 */

class OCRService {
  constructor() {
    this.ocr = null;
    this.initialized = true;
    console.log('[OCR] Service initialized with Tesseract.js OCR engine');
  }

  /**
   * Check if document has existing text layer using pdf-parse
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<{hasTextLayer: boolean, wordCount: number, pageCount: number}>}
   */
  async hasTextLayer(pdfBuffer) {
    try {
      if (!PDFParse) {
        throw new Error('pdf-parse module not loaded');
      }
      
      // pdf-parse v2 API: instantiate PDFParse class and call getText()
      const parser = new PDFParse({ data: pdfBuffer });
      const result = await parser.getText();
      
      if (!result.text || result.text.trim().length < 10) {
        return {
          hasTextLayer: false,
          wordCount: 0,
          pageCount: result.total || 0
        };
      }

      // Check if text is meaningful (not just whitespace/garbage)
      const text = result.text;
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      const pageCount = result.total || 1;
      const wordsPerPage = wordCount / pageCount;

      // If average < 5 words per page, likely scanned
      const hasText = wordsPerPage >= 5;

      console.log(`[OCR] Text layer check: ${wordCount} words across ${pageCount} pages (${wordsPerPage.toFixed(1)} per page)`);

      return {
        hasTextLayer: hasText,
        wordCount,
        pageCount
      };
    } catch (err) {
      console.error('[OCR] Error checking text layer:', err.message);
      return {
        hasTextLayer: false,
        wordCount: 0,
        pageCount: 0,
        error: err.message
      };
    }
  }

  /**
   * Extract text from PDF using built-in text layer
   * This works for text-based PDFs. Scanned PDFs need OCR engine integration.
   * 
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<Array>} Array of {pageNumber, text}
   */
  async extractTextFromPdf(pdfBuffer) {
    try {
      if (!PDFParse) {
        throw new Error('pdf-parse module not loaded');
      }
      
      // pdf-parse v2 API
      const parser = new PDFParse({ data: pdfBuffer });
      const result = await parser.getText();
      
      // Try to get per-page text (not supported by pdf-parse directly)
      // For full per-page extraction, would need pdfjs-dist or similar
      const fullText = result.text;
      const totalPages = result.total || 1;

      // Return single entry with full text
      // In production with pdfjs-dist, would split by page boundaries
      return [{
        pageNumber: 1,
        text: fullText,
        totalPages
      }];
    } catch (err) {
      console.error('[OCR] Error extracting text from PDF:', err.message);
      throw new Error(`Text extraction failed: ${err.message}`);
    }
  }

  /**
   * Extract text from scanned PDFs using Tesseract OCR
   * Converts PDF pages to images using pdfjs-dist and canvas, then runs OCR
   * 
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {Object} options - OCR options
   * @returns {Promise<Array>} Array of {pageNumber, text, error?}
   */
  async extractTextFromScannedPdf(pdfBuffer, options = {}) {
    const {
      timeout = 300000,
      languages = ['en'],
      maxPages = null,
      pageTimeout = 30000
    } = options;

    const results = [];
    let tempDir = null;
    const { spawn } = require('child_process');
    const os = require('os');

    try {
      if (!PDFParse) {
        throw new Error('pdf-parse module not loaded');
      }

      console.log('[OCR] Starting Tesseract OCR extraction for scanned PDF');
      
      // Get PDF metadata
      const parser = new PDFParse({ data: pdfBuffer });
      const pdfMetadata = await parser.getText();
      const totalPages = pdfMetadata.total || 1;
      const pagesToProcess = maxPages ? Math.min(maxPages, totalPages) : totalPages;

      console.log(`[OCR] PDF has ${totalPages} pages, will process ${pagesToProcess}`);

      // Create temp directory
      tempDir = path.join(os.tmpdir(), `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Save PDF to temp file
      const tempPdfPath = path.join(tempDir, 'input.pdf');
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      // Convert PDF to images using ImageMagick 'magick' command
      console.log('[OCR] Converting PDF pages to PNG images with ImageMagick...');

      return await new Promise((resolve, reject) => {
        const outputPattern = path.join(tempDir, 'page-%d.png');
        const pageRange = pagesToProcess === 1 ? '0' : `0-${pagesToProcess - 1}`;

        const magick = spawn('magick', [
          tempPdfPath,
          '-density', '150',
          '-quality', '85',
          outputPattern
        ], { timeout });

        let errorOutput = '';
        let successfulConversion = false;

        magick.stderr.on('data', (data) => {
          const msg = data.toString();
          if (msg.includes('error') || msg.includes('Error')) {
            errorOutput += msg;
          } else {
            console.log('[OCR]', msg.trim());
          }
        });

        magick.stdout.on('data', (data) => {
          console.log('[OCR]', data.toString().trim());
        });

        magick.on('close', async (code) => {
          if (code === 0) {
            successfulConversion = true;
            try {
              const ocrResults = await this._runTesseractOnPages(tempDir, pagesToProcess, languages, pageTimeout);
              resolve(ocrResults);
            } catch (err) {
              reject(err);
            }
          } else if (code && errorOutput) {
            console.warn('[OCR] ImageMagick conversion failed, attempting fallback...');
            try {
              const fallbackResults = await this._extractTextDirectFromPdf(pdfBuffer, pagesToProcess, languages, pageTimeout);
              resolve(fallbackResults);
            } catch (err) {
              reject(new Error(`PDF to image conversion failed: ${errorOutput || err.message}`));
            }
          }
        });

        magick.on('error', (err) => {
          console.warn('[OCR] ImageMagick not found, attempting fallback...');
          this._extractTextDirectFromPdf(pdfBuffer, pagesToProcess, languages, pageTimeout)
            .then(resolve)
            .catch(reject);
        });
      });

    } catch (err) {
      console.error('[OCR] Fatal error during OCR extraction:', err.message);
      throw new Error(`OCR extraction failed: ${err.message}`);
    } finally {
      if (tempDir && fs.existsSync(tempDir)) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
          console.log('[OCR] Cleaned up temporary files');
        } catch (err) {
          console.warn('[OCR] Failed to cleanup temp files:', err.message);
        }
      }
    }
  }

  async _runTesseractOnPages(tempDir, pageCount, languages, pageTimeout) {
    const results = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const pageStartTime = Date.now();
      const imageNum = pageNum - 1;
      const imagePath = path.join(tempDir, `page-${imageNum}.png`);

      if (!fs.existsSync(imagePath)) {
        console.warn(`[OCR] Image not found for page ${pageNum}`);
        results.push({
          pageNumber: pageNum,
          text: '',
          charCount: 0,
          confidenceScore: 0,
          error: 'Image file not found',
          duration: 0
        });
        continue;
      }

      try {
        console.log(`[OCR] Running Tesseract on page ${pageNum}...`);

        const worker = await Tesseract.createWorker();

        const { data } = await Promise.race([
          worker.recognize(imagePath),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`OCR timeout on page ${pageNum}`)), pageTimeout)
          )
        ]);

        await worker.terminate();

        const extractedText = (data.text || '').trim();
        const duration = Date.now() - pageStartTime;
        const confidence = data.confidence ? (data.confidence / 100) : 0;

        console.log(`[OCR] Page ${pageNum}: ${extractedText.length} chars, confidence=${confidence.toFixed(2)} in ${duration}ms`);

        results.push({
          pageNumber: pageNum,
          text: extractedText,
          charCount: extractedText.length,
          confidenceScore: confidence,
          duration
        });

      } catch (err) {
        const duration = Date.now() - pageStartTime;
        console.error(`[OCR] Failed on page ${pageNum}:`, err.message);

        results.push({
          pageNumber: pageNum,
          text: '',
          charCount: 0,
          confidenceScore: 0,
          error: err.message,
          duration
        });
      }
    }

    const successCount = results.filter(r => !r.error && r.charCount > 0).length;
    console.log(`[OCR] Extraction complete: ${successCount}/${results.length} pages with text extracted`);
    return results;
  }

  async _extractTextDirectFromPdf(pdfBuffer, pageCount, languages, pageTimeout) {
    console.log('[OCR] Using fallback direct PDF OCR (slower but no conversion required)');
    const results = [];

    for (let pageNum = 1; pageNum <= Math.min(pageCount, 1); pageNum++) {
      const pageStartTime = Date.now();

      try {
        console.log(`[OCR] Running Tesseract on page ${pageNum} (direct PDF)...`);

        const worker = await Tesseract.createWorker();

        const { data } = await Promise.race([
          worker.recognize(pdfBuffer),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`OCR timeout on page ${pageNum}`)), pageTimeout)
          )
        ]);

        await worker.terminate();

        const extractedText = (data.text || '').trim();
        const duration = Date.now() - pageStartTime;
        const confidence = data.confidence ? (data.confidence / 100) : 0;

        console.log(`[OCR] Page ${pageNum}: ${extractedText.length} chars, confidence=${confidence.toFixed(2)} in ${duration}ms`);

        results.push({
          pageNumber: pageNum,
          text: extractedText,
          charCount: extractedText.length,
          confidenceScore: confidence,
          duration
        });

      } catch (err) {
        const duration = Date.now() - pageStartTime;
        console.error(`[OCR] Failed on page ${pageNum}:`, err.message);

        results.push({
          pageNumber: pageNum,
          text: '',
          charCount: 0,
          confidenceScore: 0,
          error: err.message,
          duration
        });
      }
    }

    return results;
  }

  /**
   * Normalize OCR results to standard format
   * @param {Array} ocrResults - Raw OCR results
   * @returns {Array} Normalized results
   */
  normalizeResults(ocrResults) {
    return ocrResults.map(result => ({
      pageNumber: result.pageNumber,
      text: (result.text || '').trim(),
      charCount: (result.text || '').length,
      error: result.error || null,
      status: result.status || 'completed'
    }));
  }

  /**
   * Check if OCR engine is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.initialized;
  }

  /**
   * Get OCR engine info
   * @returns {Object}
   */
  getEngineInfo() {
    return {
      initialized: this.initialized,
      engine: 'pdf-parse + framework',
      status: 'Ready for OCR integration',
      supportedEngines: ['PaddleOCR', 'Tesseract.js', 'Google Cloud Vision', 'AWS Textract'],
      notes: 'Install OCR engine package and configure integration'
    };
  }

  /**
   * Validate PDF file
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<Object>} Validation result
   */
  async validatePdf(pdfBuffer) {
    try {
      const parser = new PDFParse({ data: pdfBuffer });
      return {
        valid: true,
        pages: parser.numpages,
        hasText: (parser.text || '').trim().length > 0
      };
    } catch (err) {
      return {
        valid: false,
        error: err.message
      };
    }
  }
}

module.exports = new OCRService();

