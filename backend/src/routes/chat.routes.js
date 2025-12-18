const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const chatController = require('../controllers/chat.controller');

// All chat routes require authentication
router.use(authenticate);

// POST /chat
router.post('/', chatController.postChat);

module.exports = router;
