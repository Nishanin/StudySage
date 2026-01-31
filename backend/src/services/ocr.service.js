const fs = require('fs');
const path = require('path');
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
    this.initialized = true; // Mark as initialized even without OCR engine
    console.log('[OCR] Service initialized (framework ready for OCR integration)');
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
          pageCount: result.pageCount || 0
        };
      }

      // Check if text is meaningful (not just whitespace/garbage)
      const text = result.text;
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      const pageCount = result.pageCount || 1;
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
      const totalPages = result.pageCount || 1;

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
   * Placeholder for OCR extraction from scanned PDFs
   * This requires an OCR engine (PaddleOCR, Tesseract, or cloud API)
   * 
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {Object} options - OCR options
   * @returns {Promise<Array>} Array of {pageNumber, text}
   */
  async extractTextFromScannedPdf(pdfBuffer, options = {}) {
    const {
      timeout = 300000,
      languages = ['en'],
      maxPages = null
    } = options;

    try {
      if (!PDFParse) {
        throw new Error('pdf-parse module not loaded');
      }
      
      console.log('[OCR] Scanned PDF text extraction requested');
      console.log('[OCR] NOTE: This requires OCR engine integration (PaddleOCR, Tesseract, or cloud API)');
      
      // Get PDF metadata
      const parser = new PDFParse({ data: pdfBuffer });
      const result = await parser.getText();
      const totalPages = result.pageCount || 1;
      const pagesToProcess = maxPages ? Math.min(maxPages, totalPages) : totalPages;

      console.log(`[OCR] PDF has ${totalPages} pages, processing ${pagesToProcess}`);

      // Return placeholder results indicating OCR is needed
      const results = [];
      for (let i = 1; i <= pagesToProcess; i++) {
        results.push({
          pageNumber: i,
          text: '',
          error: 'OCR engine not configured. Requires PaddleOCR, Tesseract, or cloud API integration.',
          status: 'pending'
        });
      }

      return results;
    } catch (err) {
      console.error('[OCR] Fatal error during OCR extraction:', err.message);
      throw new Error(`OCR extraction failed: ${err.message}`);
    }
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
      const pdfData = await pdfParse(pdfBuffer);
      return {
        valid: true,
        pages: pdfData.numpages,
        hasText: (pdfData.text || '').trim().length > 0
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

