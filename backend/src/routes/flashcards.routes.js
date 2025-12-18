const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learning.controller');
const { authenticate } = require('../middlewares');

// All routes require authentication
router.use(authenticate);

router.get('/', learningController.getFlashcards);

module.exports = router;
