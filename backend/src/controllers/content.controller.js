const { pool } = require('../db');
const { extractSubjectsAndSections, extractYouTubeMetadata, extractTextFromFile } = require('../services/ml.service');
const ConversionService = require('../services/conversion.service');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const fsSyncModule = require('fs');

/**
 * Upload file content (PDF, PPT, Audio)
 * POST /content/upload
 */
async function uploadFile(req, res) {
  let client;
  try {
    const userId = req.user.id; // From auth middleware
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded',
          statusCode: 400
        }
      });
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'audio/mpeg', 'audio/wav'];
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    let resourceType;
    if (fileExt === '.pdf') resourceType = 'pdf';
    else if (fileExt === '.pptx' || fileExt === '.ppt') resourceType = 'ppt';
    else if (['.mp3', '.wav', '.m4a'].includes(fileExt)) resourceType = 'audio';
    else {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Unsupported file type. Allowed: pdf, pptx, mp3, wav',
          statusCode: 400
        }
      });
    }

    const resourceId = uuidv4();
    const fileBuffer = req.file.buffer;
    const fileSize = fileBuffer.length;
    const title = req.body.title || path.parse(req.file.originalname).name;

    // Extract text content for ML processing
    const { text } = await extractTextFromFile(fileBuffer, resourceType);

    // Call ML service to get subjects/sections (deterministic mock)
    const mlResult = await extractSubjectsAndSections(text, resourceType);
    const primarySubject = mlResult.subjects[0];
    const mlConfidence = mlResult.confidence;

    // Save file to disk before database transaction
    const uploadsDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, `${resourceId}${fileExt}`);
    
    // Ensure uploads directory exists
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(filePath, fileBuffer);
      console.log(`✅ File saved to disk: ${filePath}`);
    } catch (fileError) {
      console.error('File save error:', fileError);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to save file to disk',
          statusCode: 500
        }
      });
    }

    client = await pool.connect();

    // Start transaction
    await client.query('BEGIN');

    // 1. Check for existing section with same subject and high confidence
    const CONFIDENCE_THRESHOLD = 0.80; // Reuse if existing section has >= 80% confidence
    
    const existingSectionQuery = `
      SELECT id, confidence_score
      FROM study_sections
      WHERE user_id = $1 AND title = $2
      ORDER BY confidence_score DESC
      LIMIT 1
    `;
    
    const existingSectionResult = await client.query(existingSectionQuery, [userId, primarySubject]);
    
    let sectionId;
    let reuseExistingSection = false;

    if (existingSectionResult.rows.length > 0 && existingSectionResult.rows[0].confidence_score >= CONFIDENCE_THRESHOLD) {
      // Reuse existing section with high confidence
      sectionId = existingSectionResult.rows[0].id;
      reuseExistingSection = true;
      
      console.log(`✅ Reusing existing section: ${primarySubject} (confidence: ${existingSectionResult.rows[0].confidence_score})`);
    } else {
      // Create new section
      sectionId = uuidv4();
      const newSectionQuery = `
        INSERT INTO study_sections (id, user_id, title, description, confidence_score, ml_metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      await client.query(newSectionQuery, [
        sectionId,
        userId,
        primarySubject,
        `Auto-generated section for ${primarySubject}`,
        mlConfidence,
        JSON.stringify({
          subjects: mlResult.subjects,
          sections: mlResult.sections,
          generatedAt: new Date().toISOString(),
          generatedFromResourceType: resourceType,
          confidenceThresholdUsed: CONFIDENCE_THRESHOLD
        })
      ]);
      
      console.log(`✅ Created new section: ${primarySubject} (confidence: ${mlConfidence})`);
    }

    // 2. Create resource entry
    const resourceQuery = `
      INSERT INTO study_resources 
      (id, user_id, section_id, resource_type, title, file_url, file_size_bytes, extracted_text, processing_status, ml_metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, user_id, section_id, resource_type, title, processing_status, created_at
    `;

    // File URL path - file is saved to disk in uploads directory
    const fileUrl = `/uploads/${resourceId}${fileExt}`;

    const resourceResult = await client.query(resourceQuery, [
      resourceId,
      userId,
      sectionId,
      resourceType,
      title,
      fileUrl,
      fileSize,
      text.substring(0, 10000), // Store first 10k chars
      'pending',
      JSON.stringify({
        mlResult: {
          subjects: mlResult.subjects,
          sections: mlResult.sections,
          confidence: mlResult.confidence
        },
        uploadedAt: new Date().toISOString(),
        extractionMetadata: { wordCount: text.split(/\s+/).length }
      })
    ]);

    await client.query('COMMIT');

    const resource = resourceResult.rows[0];

    res.status(201).json({
      success: true,
      data: {
        resourceId: resource.id,
        title: resource.title,
        resourceType: resource.resource_type,
        section: {
          id: sectionId,
          title: primarySubject
        },
        processingStatus: resource.processing_status,
        subjects: mlResult.subjects,
        sections: mlResult.sections,
        createdAt: resource.created_at,
        message: 'File uploaded successfully. Processing started.'
      }
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(e => console.error('Rollback error:', e));
    
    // Clean up saved file if database transaction failed
    const uploadsDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, `${resourceId}${fileExt}`);
    try {
      await fs.unlink(filePath);
      console.log(`✅ Cleaned up file after error: ${filePath}`);
    } catch (cleanupError) {
      console.error('File cleanup error:', cleanupError);
    }
    
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to upload file',
        statusCode: 500
      }
    });
  } finally {
    if (client) client.release();
  }
}

/**
 * Add YouTube content
 * POST /content/youtube
 */
async function addYouTubeContent(req, res) {
  let client;
  try {
    const userId = req.user.id;
    const { videoId, title } = req.body;

    // Validate YouTube video ID format
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid YouTube video ID. Must be 11 characters.',
          statusCode: 400
        }
      });
    }

    const resourceId = uuidv4();

    // Extract YouTube metadata (mock)
    const youtubeData = await extractYouTubeMetadata(videoId);

    // Extract text from video title/description for ML
    const textForML = `${youtubeData.title} ${youtubeData.channelTitle || ''}`;
    const mlResult = await extractSubjectsAndSections(textForML, 'youtube');
    const primarySubject = mlResult.subjects[0];
    const mlConfidence = mlResult.confidence;

    client = await pool.connect();

    // Start transaction
    await client.query('BEGIN');

    // 1. Check for existing section with same subject and high confidence
    const CONFIDENCE_THRESHOLD = 0.80; // Reuse if existing section has >= 80% confidence
    
    const existingSectionQuery = `
      SELECT id, confidence_score
      FROM study_sections
      WHERE user_id = $1 AND title = $2
      ORDER BY confidence_score DESC
      LIMIT 1
    `;
    
    const existingSectionResult = await client.query(existingSectionQuery, [userId, primarySubject]);
    
    let sectionId;
    let reuseExistingSection = false;

    if (existingSectionResult.rows.length > 0 && existingSectionResult.rows[0].confidence_score >= CONFIDENCE_THRESHOLD) {
      // Reuse existing section with high confidence
      sectionId = existingSectionResult.rows[0].id;
      reuseExistingSection = true;
      
      console.log(`✅ Reusing existing section: ${primarySubject} (confidence: ${existingSectionResult.rows[0].confidence_score})`);
    } else {
      // Create new section
      sectionId = uuidv4();
      const newSectionQuery = `
        INSERT INTO study_sections (id, user_id, title, description, confidence_score, ml_metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      await client.query(newSectionQuery, [
        sectionId,
        userId,
        primarySubject,
        `Auto-generated section for ${primarySubject}`,
        mlConfidence,
        JSON.stringify({
          subjects: mlResult.subjects,
          sections: mlResult.sections,
          generatedAt: new Date().toISOString(),
          generatedFromResourceType: 'youtube',
          confidenceThresholdUsed: CONFIDENCE_THRESHOLD
        })
      ]);
      
      console.log(`✅ Created new section: ${primarySubject} (confidence: ${mlConfidence})`);
    }

    // 2. Create resource entry
    const resourceQuery = `
      INSERT INTO study_resources 
      (id, user_id, section_id, resource_type, title, youtube_video_id, youtube_thumbnail_url, duration_seconds, processing_status, ml_metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, user_id, section_id, resource_type, title, youtube_video_id, youtube_thumbnail_url, duration_seconds, processing_status, created_at
    `;

    const resourceResult = await client.query(resourceQuery, [
      resourceId,
      userId,
      sectionId,
      'youtube',
      title || youtubeData.title,
      videoId,
      youtubeData.thumbnail,
      youtubeData.duration,
      'pending',
      JSON.stringify({
        mlResult: {
          subjects: mlResult.subjects,
          sections: mlResult.sections,
          confidence: mlResult.confidence
        },
        youtubeMetadata: {
          channelTitle: youtubeData.channelTitle,
          thumbnail: youtubeData.thumbnail
        },
        addedAt: new Date().toISOString()
      })
    ]);

    await client.query('COMMIT');

    const resource = resourceResult.rows[0];

    res.status(201).json({
      success: true,
      data: {
        resourceId: resource.id,
        title: resource.title,
        resourceType: resource.resource_type,
        videoId: resource.youtube_video_id,
        thumbnailUrl: resource.youtube_thumbnail_url,
        duration: resource.duration_seconds,
        section: {
          id: sectionId,
          title: primarySubject
        },
        processingStatus: resource.processing_status,
        subjects: mlResult.subjects,
        sections: mlResult.sections,
        createdAt: resource.created_at,
        message: 'YouTube video added successfully. Processing started.'
      }
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(e => console.error('Rollback error:', e));
    console.error('YouTube add error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to add YouTube content',
        statusCode: 500
      }
    });
  } finally {
    if (client) client.release();
  }
}

/**
 * Get all study sections for the current user
 * GET /content/sections
 */
async function getSections(req, res) {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        id, 
        user_id, 
        title, 
        description, 
        confidence_score, 
        ml_metadata,
        created_at,
        updated_at
      FROM study_sections
      WHERE user_id = $1
      ORDER BY confidence_score DESC, created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.status(200).json({
      success: true,
      data: {
        sections: result.rows.map(row => ({
          id: row.id,
          title: row.title,
          description: row.description,
          confidenceScore: row.confidence_score,
          mlMetadata: row.ml_metadata,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }))
      }
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get sections',
        statusCode: 500
      }
    });
  }
}

/**
 * Get resources in a section
 * GET /content/sections/:sectionId/resources
 */
async function getSectionResources(req, res) {
  try {
    const userId = req.user.id;
    const { sectionId } = req.params;

    const query = `
      SELECT 
        sr.id, 
        sr.title, 
        sr.resource_type, 
        sr.file_url,
        sr.youtube_video_id,
        sr.youtube_thumbnail_url,
        sr.duration_seconds,
        sr.file_size_bytes,
        sr.processing_status,
        sr.ml_metadata,
        sr.created_at
      FROM study_resources sr
      WHERE sr.user_id = $1 AND sr.section_id = $2
      ORDER BY sr.created_at DESC
    `;

    const result = await pool.query(query, [userId, sectionId]);

    res.status(200).json({
      success: true,
      data: {
        resources: result.rows.map(row => ({
          id: row.id,
          title: row.title,
          resourceType: row.resource_type,
          fileUrl: row.file_url,
          youtubeVideoId: row.youtube_video_id,
          youtubeThumbnailUrl: row.youtube_thumbnail_url,
          durationSeconds: row.duration_seconds,
          fileSizeBytes: row.file_size_bytes,
          processingStatus: row.processing_status,
          mlMetadata: row.ml_metadata,
          createdAt: row.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Get section resources error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get section resources',
        statusCode: 500
      }
    });
  }
}

/**
 * Get all resources for the current user
 * GET /content/resources
 */
async function getUserResources(req, res) {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        sr.id, 
        sr.section_id,
        ss.title as section_title,
        sr.title, 
        sr.resource_type, 
        sr.file_url,
        sr.youtube_video_id,
        sr.youtube_thumbnail_url,
        sr.duration_seconds,
        sr.file_size_bytes,
        sr.processing_status,
        sr.ml_metadata,
        sr.created_at
      FROM study_resources sr
      LEFT JOIN study_sections ss ON sr.section_id = ss.id
      WHERE sr.user_id = $1
      ORDER BY sr.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.status(200).json({
      success: true,
      data: {
        resources: result.rows.map(row => ({
          id: row.id,
          sectionId: row.section_id,
          sectionTitle: row.section_title,
          title: row.title,
          resourceType: row.resource_type,
          fileUrl: row.file_url,
          youtubeVideoId: row.youtube_video_id,
          youtubeThumbnailUrl: row.youtube_thumbnail_url,
          durationSeconds: row.duration_seconds,
          fileSizeBytes: row.file_size_bytes,
          processingStatus: row.processing_status,
          mlMetadata: row.ml_metadata,
          createdAt: row.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Get user resources error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get resources',
        statusCode: 500
      }
    });
  }
}

/**
 * GET /content/download/:resourceId
 * Download/stream a resource file by ID
 * 
 * Response: Binary file data (PDF, PPT, or audio)
 * Headers: Content-Type (application/pdf, etc.)
 */
async function downloadFile(req, res) {
  try {
    const userId = req.user.id;
    const { resourceId } = req.params;

    // Query database to get file info and verify ownership
    const query = `
      SELECT id, user_id, title, resource_type, file_url
      FROM study_resources
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [resourceId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Resource not found or access denied',
          statusCode: 404
        }
      });
    }

    const resource = result.rows[0];
    const fileUrl = resource.file_url; // e.g., /uploads/uuid.pdf
    
    // Construct file path (remove leading slash if present)
    const uploadsDir = path.join(__dirname, '../../');
    const filePath = path.join(uploadsDir, fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: {
          message: 'File not found on server',
          statusCode: 404
        }
      });
    }

    // Determine MIME type based on resource_type
    const mimeTypes = {
      pdf: 'application/pdf',
      ppt: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      audio: 'audio/mpeg',
      youtube: 'application/json' // YouTube doesn't need file download
    };

    const mimeType = mimeTypes[resource.resource_type] || 'application/octet-stream';

    // Set response headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${resource.title}${path.extname(filePath)}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Stream file to client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            message: 'Failed to download file',
            statusCode: 500
          }
        });
      }
    });

  } catch (error) {
    console.error('Download file error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to download file',
          statusCode: 500
        }
      });
    }
  }
}

/**
 * Convert PowerPoint to PDF
 * POST /content/convert-to-pdf/:resourceId
 */
async function convertToPdf(req, res) {
  let client;
  try {
    const { resourceId } = req.params;
    const userId = req.user.id;

    client = await pool.connect();

    // Get the resource from database
    const result = await client.query(
      'SELECT * FROM resources WHERE id = $1 AND user_id = $2',
      [resourceId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Resource not found',
          statusCode: 404
        }
      });
    }

    const resource = result.rows[0];
    const fileType = resource.file_type;

    // Check if it's a PowerPoint file
    if (!fileType.includes('presentation') && !fileType.includes('powerpoint')) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'File is not a PowerPoint presentation',
          statusCode: 400
        }
      });
    }

    // Get original file path
    const uploadDir = path.join(__dirname, '../../uploads');
    const originalExtension = resource.file_type.includes('pptx') ? '.pptx' : '.ppt';
    const originalPath = path.join(uploadDir, `${resourceId}${originalExtension}`);
    const pdfPath = path.join(uploadDir, `${resourceId}.pdf`);

    // Check if original file exists
    if (!fsSyncModule.existsSync(originalPath)) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Original file not found',
          statusCode: 404
        }
      });
    }

    // Check if PDF already exists
    if (fsSyncModule.existsSync(pdfPath)) {
      return res.json({
        success: true,
        message: 'PDF already exists',
        data: {
          pdfPath: `/content/download/${resourceId}.pdf`,
          converted: false,
          fileSize: fsSyncModule.statSync(pdfPath).size
        }
      });
    }

    // Convert PPT to PDF
    console.log(`🔄 Converting ${originalPath} to PDF...`);
    await ConversionService.convertPptToPdf(originalPath, pdfPath);

    res.json({
      success: true,
      message: 'File converted successfully',
      data: {
        pdfPath: `/content/download/${resourceId}.pdf`,
        converted: true,
        fileSize: fsSyncModule.statSync(pdfPath).size
      }
    });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Conversion failed',
        statusCode: 500
      }
    });
  } finally {
    if (client) client.release();
  }
}

/**
 * Get highlights for a specific page of a resource
 * GET /content/highlights/:resourceId?page=pageNumber
 */
async function getHighlights(req, res) {
  let client;
  try {
    const { resourceId } = req.params;
    const { page } = req.query;
    const userId = req.user.id;

    if (!page || isNaN(parseInt(page))) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Page number is required and must be a valid integer',
          statusCode: 400
        }
      });
    }

    const pageNumber = parseInt(page);

    client = await pool.connect();

    // Verify user owns this resource
    const resourceResult = await client.query(
      'SELECT id FROM study_resources WHERE id = $1 AND user_id = $2',
      [resourceId, userId]
    );

    if (resourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Resource not found',
          statusCode: 404
        }
      });
    }

    // Get all highlights for this page
    const highlightsResult = await client.query(
      `SELECT id, highlighted_text, highlight_color, highlight_opacity, position_data 
       FROM document_highlights 
       WHERE resource_id = $1 AND page_number = $2 
       ORDER BY created_at ASC`,
      [resourceId, pageNumber]
    );

    const highlights = highlightsResult.rows.map(row => ({
      id: row.id,
      text: row.highlighted_text,
      color: row.highlight_color,
      opacity: parseFloat(row.highlight_opacity),
      found: true, // Always true since we're returning actual highlights
      positionData: row.position_data
    }));

    return res.json({
      success: true,
      data: {
        highlights,
        pageNumber,
        count: highlights.length
      }
    });
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch highlights',
        statusCode: 500
      }
    });
  } finally {
    if (client) client.release();
  }
}

/**
 * Add a highlight to a document page
 * POST /content/highlights/:resourceId
 */
async function addHighlight(req, res) {
  let client;
  try {
    const { resourceId } = req.params;
    const { pageNumber, text, color = 'yellow', opacity = 0.4 } = req.body;
    const userId = req.user.id;

    if (!pageNumber || !text) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'pageNumber and text are required',
          statusCode: 400
        }
      });
    }

    client = await pool.connect();

    // Verify user owns this resource
    const resourceResult = await client.query(
      'SELECT id FROM study_resources WHERE id = $1 AND user_id = $2',
      [resourceId, userId]
    );

    if (resourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Resource not found',
          statusCode: 404
        }
      });
    }

    // Add the highlight
    const result = await client.query(
      `INSERT INTO document_highlights (user_id, resource_id, page_number, highlighted_text, highlight_color, highlight_opacity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, highlighted_text, highlight_color, highlight_opacity`,
      [userId, resourceId, pageNumber, text, color, opacity]
    );

    const highlight = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Highlight added successfully',
      data: {
        id: highlight.id,
        text: highlight.highlighted_text,
        color: highlight.highlight_color,
        opacity: parseFloat(highlight.highlight_opacity)
      }
    });
  } catch (error) {
    console.error('Error adding highlight:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to add highlight',
        statusCode: 500
      }
    });
  } finally {
    if (client) client.release();
  }
}

/**
 * Delete a highlight
 * DELETE /content/highlights/:resourceId/:highlightId
 */
async function deleteHighlight(req, res) {
  let client;
  try {
    const { resourceId, highlightId } = req.params;
    const userId = req.user.id;

    client = await pool.connect();

    // Verify user owns this resource and highlight
    const result = await client.query(
      `DELETE FROM document_highlights 
       WHERE id = $1 AND resource_id = $2 AND user_id = $3
       RETURNING id`,
      [highlightId, resourceId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Highlight not found',
          statusCode: 404
        }
      });
    }

    return res.json({
      success: true,
      message: 'Highlight deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete highlight',
        statusCode: 500
      }
    });
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  uploadFile,
  addYouTubeContent,
  getSections,
  getSectionResources,
  getUserResources,
  downloadFile,
  convertToPdf,
  getHighlights,
  addHighlight,
  deleteHighlight
};
