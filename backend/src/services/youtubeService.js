const axios = require('axios');
const { execFile } = require('child_process');
const path = require('path');

class YouTubeService {
  constructor() {
    // Path to the Python script that fetches transcripts
    this.transcriptScript = path.join(__dirname, '..', 'scripts', 'get_transcript.py');
    // Python executable - uses the project's virtual environment
    this.pythonPath = path.join(__dirname, '..', '..', '..', '..', '.venv', 'Scripts', 'python.exe');
  }

  /**
   * Extract video ID from YouTube URL
   * @param {string} url - YouTube URL
   * @returns {string|null} - Video ID or null if invalid
   */
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  /**
   * Get video metadata from YouTube
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} - Video metadata
   */
  async getVideoMetadata(videoId) {
    try {
      const response = await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      return {
        title: response.data.title,
        author: response.data.author_name,
        thumbnail: response.data.thumbnail_url,
      };
    } catch (error) {
      console.error('[YouTubeService] Error fetching video metadata:', error.message);
      return {
        title: `YouTube Video ${videoId}`,
        author: 'Unknown',
        thumbnail: null,
      };
    }
  }

  /**
   * Fetch transcript using Python's youtube_transcript_api (most reliable method)
   * @param {string} videoId - YouTube video ID
   * @param {string} lang - Preferred language code (default: 'en')
   * @returns {Promise<Object>} - Transcript data
   */
  async getTranscript(videoId, lang = 'en') {
    console.log(`[YouTubeService] Fetching transcript for video: ${videoId}`);
    
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Invalid video ID provided');
    }

    return new Promise((resolve, reject) => {
      execFile(
        this.pythonPath,
        [this.transcriptScript, videoId, lang],
        { timeout: 30000, maxBuffer: 1024 * 1024 * 5 }, // 30s timeout, 5MB buffer
        (error, stdout, stderr) => {
          if (stderr) {
            console.warn(`[YouTubeService] Python stderr: ${stderr}`);
          }

          // Parse stdout as JSON
          let result;
          try {
            result = JSON.parse(stdout);
          } catch (parseError) {
            console.error('[YouTubeService] Failed to parse Python output:', stdout);
            return reject(new Error('Failed to parse transcript response'));
          }

          if (result.success) {
            console.log(`[YouTubeService] Transcript fetched successfully. ${result.totalSegments} segments, ${result.fullText.length} characters`);
            return resolve(result);
          } else {
            console.error('[YouTubeService] Python script error:', result.error);
            
            // Provide user-friendly error messages
            const errMsg = result.error || '';
            if (errMsg.includes('TranscriptsDisabled') || errMsg.includes('disabled')) {
              return reject(new Error('Transcripts are disabled for this video.'));
            } else if (errMsg.includes('NoTranscriptFound') || errMsg.includes('no transcripts')) {
              return reject(new Error('No transcripts found for this video. It may not have captions enabled.'));
            } else if (errMsg.includes('VideoUnavailable')) {
              return reject(new Error('Video is unavailable or does not exist.'));
            } else {
              return reject(new Error(`Failed to fetch transcript: ${errMsg}`));
            }
          }
        }
      );
    });
  }

  /**
   * Generate notes from transcript
   * @param {string} transcript - Full transcript text
   * @returns {Object} - Generated notes
   */
  generateNotes(transcript) {
    // Split into paragraphs (every ~500 characters)
    const paragraphs = [];
    const words = transcript.split(' ');
    let currentParagraph = '';

    for (const word of words) {
      currentParagraph += word + ' ';
      if (currentParagraph.length >= 500) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
    }
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }

    // Extract key points (sentences ending with . ! ?)
    const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
    const keyPoints = sentences
      .filter(s => s.split(' ').length >= 5) // Only sentences with 5+ words
      .slice(0, 10); // Top 10 key points

    return {
      paragraphs,
      keyPoints,
      wordCount: words.length,
      estimatedReadTime: Math.ceil(words.length / 200), // Assuming 200 words per minute
    };
  }

  /**
   * Process YouTube video - get transcript and generate notes
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} - Complete video data with transcript and notes
   */
  async processVideo(videoId) {
    try {
      // Fetch video metadata and transcript in parallel
      const [metadata, transcriptData] = await Promise.all([
        this.getVideoMetadata(videoId),
        this.getTranscript(videoId),
      ]);

      // Generate notes from transcript
      const notes = this.generateNotes(transcriptData.fullText);

      return {
        success: true,
        videoId,
        metadata,
        transcript: transcriptData.transcript,
        fullText: transcriptData.fullText,
        notes,
        totalSegments: transcriptData.totalSegments,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new YouTubeService();
