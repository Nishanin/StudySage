const axios = require("axios");

class YouTubeService {
  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    console.log(`[YouTubeService] Using ML service: ${this.mlServiceUrl}`);
  }

  /**
   * Extract video ID from YouTube URL
   * @param {string} url - YouTube URL
   * @returns {string|null} - Video ID or null if invalid
   */
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
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
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      );

      return {
        title: response.data.title,
        author: response.data.author_name,
        thumbnail: response.data.thumbnail_url,
      };
    } catch (error) {
      console.error(
        "[YouTubeService] Error fetching video metadata:",
        error.message,
      );
      return {
        title: `YouTube Video ${videoId}`,
        author: "Unknown",
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
  async getTranscript(videoId, lang = "en") {
    console.log(`[YouTubeService] Fetching transcript for video: ${videoId}`);

    if (!videoId || typeof videoId !== "string") {
      throw new Error("Invalid video ID provided");
    }

    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/api/transcript`,
        { videoId, lang },
        { timeout: 30000 },
      );

      const result = response.data;
      if (result.success) {
        console.log(
          `[YouTubeService] Transcript fetched successfully. ${result.totalSegments} segments, ${result.fullText.length} characters`,
        );
        return result;
      }

      const errMsg = result.error || "";
      if (errMsg.includes("TranscriptsDisabled") || errMsg.includes("disabled")) {
        throw new Error("Transcripts are disabled for this video.");
      } else if (
        errMsg.includes("NoTranscriptFound") ||
        errMsg.includes("no transcripts")
      ) {
        throw new Error(
          "No transcripts found for this video. It may not have captions enabled.",
        );
      } else if (errMsg.includes("VideoUnavailable")) {
        throw new Error("Video is unavailable or does not exist.");
      }

      throw new Error(`Failed to fetch transcript: ${errMsg}`);
    } catch (error) {
      const errMsg = error.response?.data?.error || error.message || "";
      console.error("[YouTubeService] ML service error:", errMsg);
      throw new Error(errMsg || "Failed to fetch transcript");
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
    const words = transcript.split(" ");
    let currentParagraph = "";

    for (const word of words) {
      currentParagraph += word + " ";
      if (currentParagraph.length >= 500) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = "";
      }
    }
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }

    // Extract key points (sentences ending with . ! ?)
    const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
    const keyPoints = sentences
      .filter((s) => s.split(" ").length >= 5) // Only sentences with 5+ words
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
