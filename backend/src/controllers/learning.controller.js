const learningService = require('../services/learning.service');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * POST /api/learning/flashcards
 * Create flashcard generation request
 */
const createFlashcardRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { resource_id, section_id, context_text, difficulty } = req.body;

  // Validate input
  if (!context_text || context_text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'context_text is required',
    });
  }

  if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: 'difficulty must be easy, medium, or hard',
    });
  }

  console.log('[Learning Controller] Creating flashcard request for user:', userId);

  const request = await learningService.createLearningRequest(userId, 'flashcard', {
    resourceId: resource_id,
    sectionId: section_id,
    contextText: context_text,
    preferences: { difficulty: difficulty || 'medium' },
  });

  res.status(201).json({
    success: true,
    message: 'Flashcard generation request created',
    data: {
      request_id: request.id,
      status: request.status,
      created_at: request.createdAt,
    },
  });
});

/**
 * POST /api/learning/quizzes
 * Create quiz generation request
 */
const createQuizRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { resource_id, section_id, context_text, quiz_type, number_of_questions } = req.body;

  // Validate input
  if (!context_text || context_text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'context_text is required',
    });
  }

  if (quiz_type && !['mcq', 'short_answer', 'mixed'].includes(quiz_type)) {
    return res.status(400).json({
      success: false,
      message: 'quiz_type must be mcq, short_answer, or mixed',
    });
  }

  if (number_of_questions && (number_of_questions < 1 || number_of_questions > 20)) {
    return res.status(400).json({
      success: false,
      message: 'number_of_questions must be between 1 and 20',
    });
  }

  console.log('[Learning Controller] Creating quiz request for user:', userId);

  const request = await learningService.createLearningRequest(userId, 'quiz', {
    resourceId: resource_id,
    sectionId: section_id,
    contextText: context_text,
    preferences: {
      quiz_type: quiz_type || 'mcq',
      number_of_questions: number_of_questions || 5,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Quiz generation request created',
    data: {
      request_id: request.id,
      status: request.status,
      created_at: request.createdAt,
    },
  });
});

/**
 * POST /api/learning/notes
 * Create notes generation request
 */
const createNotesRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { resource_id, section_id, context_text, note_style } = req.body;

  // Validate input
  if (!context_text || context_text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'context_text is required',
    });
  }

  if (note_style && !['summary', 'bullet', 'detailed'].includes(note_style)) {
    return res.status(400).json({
      success: false,
      message: 'note_style must be summary, bullet, or detailed',
    });
  }

  console.log('[Learning Controller] Creating notes request for user:', userId);

  const request = await learningService.createLearningRequest(userId, 'notes', {
    resourceId: resource_id,
    sectionId: section_id,
    contextText: context_text,
    preferences: { note_style: note_style || 'summary' },
  });

  res.status(201).json({
    success: true,
    message: 'Notes generation request created',
    data: {
      request_id: request.id,
      status: request.status,
      created_at: request.createdAt,
    },
  });
});

/**
 * GET /api/learning/requests/:requestId
 * Get learning request status and result
 */
const getRequestStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { requestId } = req.params;

  console.log('[Learning Controller] Getting request status:', requestId);

  const request = await learningService.getRequest(requestId, userId);

  res.json({
    success: true,
    data: {
      id: request.id,
      request_type: request.request_type,
      status: request.status,
      generated_content: request.generated_content,
      error_message: request.error_message,
      created_at: request.created_at,
      completed_at: request.completed_at,
    },
  });
});

/**
 * GET /api/learning/requests
 * Get user's learning requests
 */
const getUserRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type, status, limit, offset } = req.query;

  console.log('[Learning Controller] Getting user requests:', userId);

  const requests = await learningService.getUserRequests(userId, {
    requestType: type,
    status,
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0,
  });

  res.json({
    success: true,
    data: {
      requests: requests.map(r => ({
        id: r.id,
        request_type: r.request_type,
        status: r.status,
        resource_title: r.resource_title,
        section_title: r.section_title,
        created_at: r.created_at,
        completed_at: r.completed_at,
      })),
      total: requests.length,
    },
  });
});

/**
 * POST /api/learning/ml-callback
 * Receive ML service callback with generated content
 */
const handleMLCallback = asyncHandler(async (req, res) => {
  const { request_id, status, generated_content, error } = req.body;

  if (!request_id) {
    return res.status(400).json({
      success: false,
      message: 'request_id is required',
    });
  }

  console.log('[Learning Controller] Received ML callback for request:', request_id);

  await learningService.receiveMLResponse(request_id, {
    status,
    generated_content,
    error,
  });

  res.json({
    success: true,
    message: 'ML response processed',
  });
});

/**
 * GET /api/flashcards
 * Get user's flashcards (completed requests)
 */
const getFlashcards = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  console.log('[Learning Controller] Getting flashcards for user:', userId);

  const data = await learningService.getFlashcards(userId);

  res.json({
    success: true,
    data,
  });
});

/**
 * GET /api/quizzes
 * Get user's quizzes (completed requests)
 */
const getQuizzes = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  console.log('[Learning Controller] Getting quizzes for user:', userId);

  const data = await learningService.getQuizzes(userId);

  res.json({
    success: true,
    data,
  });
});

/**
 * GET /api/notes
 * Get user's notes (completed requests)
 */
const getNotes = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  console.log('[Learning Controller] Getting notes for user:', userId);

  const data = await learningService.getNotes(userId);

  res.json({
    success: true,
    data,
  });
});

module.exports = {
  createFlashcardRequest,
  createQuizRequest,
  createNotesRequest,
  getRequestStatus,
  getUserRequests,
  handleMLCallback,
  getFlashcards,
  getQuizzes,
  getNotes,
};
