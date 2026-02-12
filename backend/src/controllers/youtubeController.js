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
  try {
    const { videoId, videoUrl } = req.body;

    if (!videoId && !videoUrl) {
      return res.status(400).json({
        success: false,
        error: { message: 'videoId or videoUrl is required' },
      });
    }

    // Extract video ID if URL is provided
    const id = videoId || youtubeService.extractVideoId(videoUrl);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid YouTube URL or video ID' },
      });
    }

    // Fetch transcript
    const transcriptData = await youtubeService.getTranscript(id);

    return res.status(200).json({
      success: true,
      data: {
        videoId: id,
        ...transcriptData,
      },
    });
  } catch (error) {
    console.error('Error getting transcript:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch transcript' },
    });
  }
}

/**
 * Process YouTube video - get metadata, transcript, and generate notes
 * POST /youtube/process
 * Body: { videoId, videoUrl, workspaceId }
 */
async function processVideo(req, res) {
  try {
    const { videoId, videoUrl, workspaceId } = req.body;

    if (!videoId && !videoUrl) {
      return res.status(400).json({
        success: false,
        error: { message: 'videoId or videoUrl is required' },
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: { message: 'workspaceId is required' },
      });
    }

    // Extract video ID if URL is provided
    const id = videoId || youtubeService.extractVideoId(videoUrl);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid YouTube URL or video ID' },
      });
    }

    // Process video (get metadata, transcript, and notes)
    const videoData = await youtubeService.processVideo(id);

    // Create resource in database
    const { data: resource, error: resourceError } = await resourceModel.create({
      workspace_id: workspaceId,
      title: videoData.metadata.title,
      type: 'video',
    });

    if (resourceError) {
      console.error('Error creating resource:', resourceError);
      // Continue without saving to database
      return res.status(200).json({
        success: true,
        data: {
          ...videoData,
          resourceCreated: false,
          warning: 'Video processed but not saved to database',
        },
      });
    }

    // Store transcript chunks in database
    try {
      const chunkPromises = videoData.transcript.map((segment, index) => {
        return resourceTextChunkModel.create({
          resource_id: resource.id,
          chunk_text: segment.text,
          chunk_index: index,
          start_page: Math.floor(segment.start / 60), // Store minute as "page"
          end_page: Math.floor((segment.start + segment.duration) / 60),
        });
      });

      await Promise.all(chunkPromises);
    } catch (chunkError) {
      console.error('Error storing transcript chunks:', chunkError);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...videoData,
        resourceId: resource.id,
        resourceCreated: true,
      },
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
      data: {
        videoId,
        ...metadata,
      },
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
