const youtubeService = require('../services/youtubeService');
const ResourceModel = require('../models/resourceModel');
const ResourceTextChunkModel = require('../models/resourceTextChunkModel');

const resourceModel = new ResourceModel();
const resourceTextChunkModel = new ResourceTextChunkModel();

/**
 * Get transcript for a YouTube video
 * POST /youtube/transcript
 * Body: { videoId, videoUrl }
 */
async function getTranscript(req, res) {
  console.log('[YouTubeController] getTranscript endpoint called');
  console.log('[YouTubeController] Request body:', JSON.stringify(req.body));
  
  try {
    const { videoId, videoUrl } = req.body;

    if (!videoId && !videoUrl) {
      console.log('[YouTubeController] Missing videoId and videoUrl');
      return res.status(400).json({
        success: false,
        error: { message: 'videoId or videoUrl is required' },
      });
    }

    // Extract video ID if URL is provided
    const id = videoId || youtubeService.extractVideoId(videoUrl);
    console.log('[YouTubeController] Extracted video ID:', id);

    if (!id) {
      console.log('[YouTubeController] Invalid YouTube URL or video ID');
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid YouTube URL or video ID' },
      });
    }

    // Fetch transcript
    console.log('[YouTubeController] Calling youtubeService.getTranscript...');
    const transcriptData = await youtubeService.getTranscript(id);
    console.log('[YouTubeController] Transcript fetched successfully');

    return res.status(200).json({
      success: true,
      data: {
        videoId: id,
        ...transcriptData,
      },
    });
  } catch (error) {
    console.error('[YouTubeController] Error getting transcript:', error);
    console.error('[YouTubeController] Error message:', error.message);
    console.error('[YouTubeController] Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: { 
        message: error.message || 'Failed to fetch transcript',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
    });
  }
}

/**
 * Process YouTube video (metadata + transcript + save to database)
 * POST /youtube/process
 * Body: { videoUrl, workspaceId }
 */
async function processVideo(req, res) {
  try {
    const { videoUrl, workspaceId } = req.body;
    const userId = req.user.id;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: { message: 'videoUrl is required' },
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: { message: 'workspaceId is required' },
      });
    }

    // Extract video ID
    const videoId = youtubeService.extractVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid YouTube URL' },
      });
    }

    // Fetch metadata and transcript
    const [metadata, transcriptData] = await Promise.all([
      youtubeService.getVideoMetadata(videoId),
      youtubeService.getTranscript(videoId),
    ]);

    // Save as resource
    const resource = await resourceModel.create({
      userId,
      workspaceId,
      resourceType: 'youtube',
      name: metadata.title,
      youtubeUrl: videoUrl,
      youtubeVideoId: videoId,
      metadata: {
        ...metadata,
        transcript: transcriptData,
      },
    });

    return res.status(201).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('Error processing video:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to process video' },
    });
  }
}

/**
 * Get video metadata
 * GET /youtube/metadata/:videoId
 */
async function getMetadata(req, res) {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: { message: 'videoId is required' },
      });
    }

    const metadata = await youtubeService.getVideoMetadata(videoId);

    return res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('Error getting metadata:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch metadata' },
    });
  }
}

module.exports = {
  getTranscript,
  processVideo,
  getMetadata,
};

