const express = require("express");
const youtubeController = require("../controllers/youtubeController");
const auth = require("../middlewares/auth");

const router = express.Router();

// Get transcript for a YouTube video (auth temporarily disabled for testing)
router.post("/transcript", youtubeController.getTranscript);

// Process YouTube video (metadata + transcript)
router.post("/process", youtubeController.processVideo);

// Get video metadata
router.get("/metadata/:videoId", youtubeController.getMetadata);

module.exports = router;
