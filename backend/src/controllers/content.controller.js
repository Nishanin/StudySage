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

    client = await pool.connect();

    // Start transaction
    await client.query('BEGIN');

    // 1. Create or get section for the primary subject
    const sectionQuery = `
      INSERT INTO study_sections (id, user_id, title, description, confidence_score, ml_metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    const sectionId = uuidv4();
    const sectionResult = await client.query(sectionQuery, [
      sectionId,
      userId,
      primarySubject,
      `Auto-generated section for ${primarySubject}`,
      mlResult.confidence,
      JSON.stringify({
        subjects: mlResult.subjects,
        sections: mlResult.sections,
        extractedAt: new Date().toISOString()
      })
    ]);

    const actualSectionId = sectionResult.rows[0]?.id || sectionId;

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
      actualSectionId,
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
          id: actualSectionId,
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

    client = await pool.connect();

    // Start transaction
    await client.query('BEGIN');

    // 1. Create section
    const sectionQuery = `
      INSERT INTO study_sections (id, user_id, title, description, confidence_score, ml_metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    const sectionId = uuidv4();
    await client.query(sectionQuery, [
      sectionId,
      userId,
      primarySubject,
      `Auto-generated section for ${primarySubject}`,
      mlResult.confidence,
      JSON.stringify({
        subjects: mlResult.subjects,
        sections: mlResult.sections,
        extractedAt: new Date().toISOString()
      })
    ]);

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

module.exports = {
  uploadFile,
  addYouTubeContent
};
