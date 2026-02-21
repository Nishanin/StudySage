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
        // Support both legacy and new ML service response
        const segments = result.segments || result.transcript || [];
        const totalSegments = Array.isArray(segments) ? segments.length : 0;
        const fullText = Array.isArray(segments)
          ? segments.map((s) => s.text).join(" ")
          : result.fullText || "";
        console.log(
          `[YouTubeService] Transcript fetched successfully. ${totalSegments} segments, ${fullText.length} characters`,
        );
        return { ...result, segments, totalSegments, fullText };
      }

      const errMsg = result.error || "";
      if (
        errMsg.includes("TranscriptsDisabled") ||
        errMsg.includes("disabled")
      ) {
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
}

module.exports = new YouTubeService();
