const asyncHandler = require('../middlewares/asyncHandler');
const { pool } = require('../db');
const ocrService = require('../services/ocr.service');
const fs = require('fs');
const path = require('path');

/**
 * OCR Controller - Handles scanned PDF text extraction
 */

/**
 * Check if document is scanned and trigger OCR if needed
 * @route POST /api/ocr/check-and-process
 * @access Private
 */
const checkAndProcessPdf = asyncHandler(async (req, res) => {
  const { resourceId, isScannedPdf } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!resourceId) {
    return res.status(400).json({
      success: false,
      error: 'resourceId is required'
    });
  }

  // Check if resource exists
  const resourceResult = await pool.query(
    'SELECT * FROM study_resources WHERE id = $1 AND user_id = $2',
    [resourceId, userId]
  );

  if (resourceResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Resource not found'
    });
  }

  const resource = resourceResult.rows[0];
  console.log(`[OCR] Resource found: id=${resource.id}, file_url=${resource.file_url}, type=${resource.resource_type}`);

  // Only process PDFs
  if (resource.resource_type !== 'pdf') {
    return res.status(400).json({
      success: false,
      error: 'Only PDF resources can be processed for OCR'
    });
  }

  // If not a scanned PDF, return immediately
  if (!isScannedPdf) {
    await pool.query(
      'UPDATE study_resources SET is_scanned_pdf = false WHERE id = $1',
      [resourceId]
    );

    return res.status(200).json({
      success: true,
      message: 'Document is text-based PDF, OCR not needed',
      isScannedPdf: false,
      ocrCompleted: false
    });
  }

  // Check if OCR already completed
  if (resource.ocr_completed) {
    return res.status(200).json({
      success: true,
      message: 'OCR already completed for this document',
      isScannedPdf: true,
      ocrCompleted: true,
      jobId: resource.ocr_job_id
    });
  }

  // Check if OCR job already exists and is in progress
  const jobResult = await pool.query(
    'SELECT * FROM document_ocr_jobs WHERE resource_id = $1 AND status = $2',
    [resourceId, 'processing']
  );

  if (jobResult.rows.length > 0) {
    return res.status(200).json({
      success: true,
      message: 'OCR job already in progress',
      isScannedPdf: true,
      ocrCompleted: false,
      jobId: jobResult.rows[0].id,
      status: 'processing'
    });
  }

  // Trigger async OCR job
  const jobId = await triggerOcrJob(resourceId, userId, resource.file_url, resource.total_pages);

  res.status(202).json({
    success: true,
    message: 'OCR processing started',
    isScannedPdf: true,
    ocrCompleted: false,
    jobId,
    status: 'pending'
  });
});

/**
 * Get OCR results for a resource
 * @route GET /api/ocr/results/:resourceId
 * @access Private
 */
const getOcrResults = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const userId = req.user.id;

  // Verify resource ownership
  const resourceResult = await pool.query(
    'SELECT * FROM study_resources WHERE id = $1 AND user_id = $2',
    [resourceId, userId]
  );

  if (resourceResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Resource not found'
    });
  }

  // Get OCR results
  const resultsResult = await pool.query(
    `SELECT page_number, extracted_text, char_count, confidence_score, processing_error, created_at
     FROM document_ocr_results
     WHERE resource_id = $1 AND user_id = $2
     ORDER BY page_number ASC`,
    [resourceId, userId]
  );

  const results = resultsResult.rows.map(row => ({
    pageNumber: row.page_number,
    text: row.extracted_text,
    charCount: row.char_count,
    confidenceScore: parseFloat(row.confidence_score),
    error: row.processing_error,
    createdAt: row.created_at
  }));

  res.status(200).json({
    success: true,
    data: {
      resourceId,
      totalPages: results.length,
      results
    }
  });
});

/**
 * Get OCR job status
 * @route GET /api/ocr/job/:jobId
 * @access Private
 */
const getOcrJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;

  const jobResult = await pool.query(
    `SELECT * FROM document_ocr_jobs
     WHERE id = $1 AND user_id = $2`,
    [jobId, userId]
  );

  if (jobResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  const job = jobResult.rows[0];

  res.status(200).json({
    success: true,
    data: {
      jobId: job.id,
      resourceId: job.resource_id,
      status: job.status,
      progress: {
        totalPages: job.total_pages,
        processedPages: job.processed_pages,
        percentComplete: job.total_pages ? Math.round((job.processed_pages / job.total_pages) * 100) : 0
      },
      timing: {
        startedAt: job.started_at,
        completedAt: job.completed_at,
        durationMs: job.duration_ms
      },
      error: job.error_message,
      retryCount: job.retry_count,
      maxRetries: job.max_retries
    }
  });
});

/**
 * Retrieve consolidated OCR text for a document
 * @route GET /api/ocr/text/:resourceId
 * @access Private
 */
const getOcrText = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const userId = req.user.id;

  // Verify resource ownership
  const resourceResult = await pool.query(
    'SELECT * FROM study_resources WHERE id = $1 AND user_id = $2',
    [resourceId, userId]
  );

  if (resourceResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Resource not found'
    });
  }

  const resource = resourceResult.rows[0];

  if (!resource.ocr_completed) {
    return res.status(400).json({
      success: false,
      error: 'OCR not yet completed for this document'
    });
  }

  // Get all OCR text
  const resultsResult = await pool.query(
    `SELECT page_number, extracted_text
     FROM document_ocr_results
     WHERE resource_id = $1
     ORDER BY page_number ASC`,
    [resourceId]
  );

  // Consolidate text by page
  const consolidatedText = resultsResult.rows
    .map(row => `[Page ${row.page_number}]\n${row.extracted_text}`)
    .join('\n\n---\n\n');

  const totalChars = resultsResult.rows.reduce((sum, row) => sum + (row.extracted_text || '').length, 0);

  res.status(200).json({
    success: true,
    data: {
      resourceId,
      resourceTitle: resource.title,
      totalPages: resultsResult.rows.length,
      totalCharacters: totalChars,
      consolidatedText
    }
  });
});

/**
 * Internal: Trigger OCR job (async)
 */
async function triggerOcrJob(resourceId, userId, fileUrl, totalPages) {
  try {
    console.log(`[OCR] triggerOcrJob called: resourceId=${resourceId}, fileUrl=${fileUrl}`);
    
    // Create job record
    const jobResult = await pool.query(
      `INSERT INTO document_ocr_jobs (resource_id, user_id, status, total_pages)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [resourceId, userId, 'pending', totalPages || 0]
    );

    const jobId = jobResult.rows[0].id;

    // Update resource with job ID
    await pool.query(
      'UPDATE study_resources SET ocr_job_id = $1, is_scanned_pdf = true WHERE id = $2',
      [jobId, resourceId]
    );

    // Start async OCR processing (non-blocking)
    processOcrJobAsync(jobId, resourceId, userId, fileUrl).catch(err => {
      console.error(`[OCR] Async job ${jobId} failed:`, err.message);
    });

    return jobId;
  } catch (err) {
    console.error('[OCR] Failed to create OCR job:', err.message);
    throw err;
  }
}

/**
 * Async OCR processing (runs in background)
 */
async function processOcrJobAsync(jobId, resourceId, userId, fileUrl) {
  const startTime = Date.now();

  try {
    // Update job status to processing
    await pool.query(
      `UPDATE document_ocr_jobs SET status = $1, started_at = $2 WHERE id = $3`,
      ['processing', new Date(), jobId]
    );

    console.log(`[OCR] Starting async job ${jobId} for resource ${resourceId}`);
    console.log(`[OCR] File URL: ${fileUrl}`);

    // Get file from URL (blob URL from backend)
    const fileBuffer = await fetchFileBuffer(fileUrl);

    // Check if OCR is available
    if (!ocrService.isAvailable()) {
      throw new Error('OCR service not available');
    }

    // Extract text using OCR
    const ocrResults = await ocrService.extractTextFromScannedPdf(fileBuffer, {
      timeout: 300000, // 5 minutes
      languages: ['en']
    });

    // Store results in database
    for (const result of ocrResults) {
      if (result.error) {
        console.warn(`[OCR] Page ${result.pageNumber} had error:`, result.error);
      }

      await pool.query(
        `INSERT INTO document_ocr_results (resource_id, user_id, page_number, extracted_text, char_count)
         VALUES ($1, $2, $3, $4, $5)`,
        [resourceId, userId, result.pageNumber, result.text, (result.text || '').length]
      );
    }

    // Update job status to completed
    const duration = Date.now() - startTime;
    await pool.query(
      `UPDATE document_ocr_jobs 
       SET status = $1, completed_at = $2, processed_pages = $3, duration_ms = $4
       WHERE id = $5`,
      ['completed', new Date(), ocrResults.length, duration, jobId]
    );

    // Mark resource as OCR completed
    await pool.query(
      'UPDATE study_resources SET ocr_completed = true, ocr_text = $1 WHERE id = $2',
      [
        ocrResults.map(r => `[Page ${r.pageNumber}]\n${r.text}`).join('\n\n'),
        resourceId
      ]
    );

    console.log(`[OCR] Job ${jobId} completed successfully in ${duration}ms`);
  } catch (err) {
    console.error(`[OCR] Job ${jobId} failed:`, err.message);

    const duration = Date.now() - startTime;
    
    // Update job status to failed
    await pool.query(
      `UPDATE document_ocr_jobs 
       SET status = $1, error_message = $2, duration_ms = $3
       WHERE id = $4`,
      ['failed', err.message, duration, jobId]
    );
  }
}

/**
 * Fetch file from storage URL
 */
async function fetchFileBuffer(fileUrl) {
  try {
    console.log(`[OCR] fetchFileBuffer called with URL: ${fileUrl}`);
    
    if (!fileUrl) {
      throw new Error('fileUrl is null or undefined');
    }
    
    // If it's a local /uploads URL, use direct file system access
    const uploadsMatch = fileUrl.match(/\/uploads\/(.+)$/);
    
    if (uploadsMatch) {
      const relativePath = uploadsMatch[1];
      const uploadDir = path.join(__dirname, '../../uploads');
      const filePath = path.join(uploadDir, ...relativePath.split('/'));
      
      console.log(`[OCR] Checking file at: ${filePath}`);
      
      // Verify file exists before reading
      if (fs.existsSync(filePath)) {
        console.log(`[OCR] Reading file from disk: ${filePath}`);
        return fs.readFileSync(filePath);
      } else {
        console.log(`[OCR] File not found at: ${filePath}`);
        throw new Error(`File not found: ${filePath}`);
      }
    }

    // Fallback: try to fetch as HTTP URL
    console.log(`[OCR] Fetching file from HTTP: ${fileUrl}`);
    const axios = require('axios');
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 30000 });
    return Buffer.from(response.data);
  } catch (err) {
    console.error(`[OCR] Error fetching file from ${fileUrl}:`, err.message);
    throw new Error(`Failed to fetch file: ${err.message}`);
  }
}

module.exports = {
  checkAndProcessPdf,
  getOcrResults,
  getOcrJobStatus,
  getOcrText
};
