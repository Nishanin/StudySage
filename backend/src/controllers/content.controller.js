const { pool } = require('../db');
const { extractSubjectsAndSections, extractYouTubeMetadata, extractTextFromFile } = require('../services/ml.service');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

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

    // Mock file URL - in production, would be S3/cloud storage
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

module.exports = {
  uploadFile,
  addYouTubeContent,
  getSections,
  getSectionResources,
  getUserResources
};
