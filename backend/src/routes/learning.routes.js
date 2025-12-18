const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learning.controller');
const { authenticate } = require('../middlewares');

// All learning routes require authentication
router.use(authenticate);

router.post('/flashcards', learningController.createFlashcardRequest);

router.post('/quizzes', learningController.createQuizRequest);

router.post('/notes', learningController.createNotesRequest);

router.get('/requests/:requestId', learningController.getRequestStatus);

router.get('/requests', learningController.getUserRequests);

router.post('/ml-callback', learningController.handleMLCallback);

module.exports = router;
