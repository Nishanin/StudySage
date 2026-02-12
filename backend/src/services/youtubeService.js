const { YoutubeTranscript } = require('youtube-transcript');
const axios = require('axios');

class YouTubeService {
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
      // Using oEmbed API for basic metadata
      const response = await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      return {
        title: response.data.title,
        author: response.data.author_name,
        thumbnail: response.data.thumbnail_url,
      };
    } catch (error) {
      console.error('Error fetching video metadata:', error.message);
      return {
        title: `YouTube Video ${videoId}`,
        author: 'Unknown',
        thumbnail: null,
      };
    }
  }

  /**
   * Fetch transcript for a YouTube video
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} - Transcript data with text and timestamps
   */
  async getTranscript(videoId) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript available for this video');
      }

      // Format transcript with timestamps
      const formattedTranscript = transcript.map(entry => ({
        text: entry.text,
        start: entry.offset / 1000, // Convert to seconds
        duration: entry.duration / 1000,
      }));

      // Create full text version
      const fullText = transcript.map(entry => entry.text).join(' ');

      return {
        success: true,
        transcript: formattedTranscript,
        fullText,
        totalSegments: transcript.length,
      };
    } catch (error) {
      console.error('Error fetching transcript:', error.message);
      throw new Error(
        error.message.includes('Transcript is disabled')
          ? 'Transcript is not available for this video'
          : 'Failed to fetch transcript. Please try again.'
      );
    }
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
