const express = require('express');
const youtubeController = require('../controllers/youtubeController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Get transcript for a YouTube video
router.post('/transcript', auth, youtubeController.getTranscript);

// Process YouTube video (metadata + transcript + notes)
router.post('/process', auth, youtubeController.processVideo);

// Get video metadata
router.get('/metadata/:videoId', auth, youtubeController.getMetadata);

module.exports = router;
