const { pool } = require('../db');
const axios = require('axios');

// ML Service Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000/api/ml';
const ML_SERVICE_TIMEOUT = 5000; // 5 seconds timeout for ML requests

async function createLearningRequest(userId, requestType, payload) {
  const { resourceId, sectionId, contextText, preferences } = payload;

  console.log(`[Learning] Creating ${requestType} request for user:`, userId);

  try {
    // Validate resource/section ownership
    if (resourceId) {
      await verifyResourceOwnership(userId, resourceId);
    }
    if (sectionId) {
      await verifySectionOwnership(userId, sectionId);
    }

    // Insert learning request into database
    const result = await pool.query(
      `INSERT INTO learning_requests (
        user_id, resource_id, section_id, request_type, 
        context_text, preferences, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userId, resourceId, sectionId, requestType, contextText, preferences, 'pending']
    );

    const request = result.rows[0];
    console.log(`[Learning] Request created:`, request.id);

    // Send to ML service asynchronously (don't wait for response)
    sendToMLService(request).catch(error => {
      console.error(`[Learning] Failed to send to ML service:`, error.message);
      updateRequestStatus(request.id, 'failed', error.message);
    });

    return {
      id: request.id,
      requestType: request.request_type,
      status: request.status,
      createdAt: request.created_at,
    };
  } catch (error) {
    console.error('[Learning] Failed to create request:', error);
    throw error;
  }
}

async function sendToMLService(request) {
  try {
    console.log(`[Learning] Sending request ${request.id} to ML service`);

    // Get additional context (resource/section details)
    const context = await getRequestContext(request);

    // Build ML payload according to contract
    const mlPayload = {
      request_id: request.id,
      user_id: request.user_id,
      type: request.request_type,
      context: {
        section: context.sectionTitle || 'Untitled Section',
        content: request.context_text,
        resource_type: context.resourceType,
        resource_title: context.resourceTitle,
      },
      preferences: request.preferences || {},
    };

    // Update request with ML payload
    await pool.query(
      `UPDATE learning_requests 
       SET ml_request_payload = $1, status = 'processing'
       WHERE id = $2`,
      [mlPayload, request.id]
    );

    // Send to ML service with timeout
    const response = await axios.post(
      `${ML_SERVICE_URL}/generate`,
      mlPayload,
      { timeout: ML_SERVICE_TIMEOUT }
    );

    console.log(`[Learning] ML service accepted request ${request.id}`);

    // ML service should return results asynchronously
    // For now, just log the acknowledgment
    if (response.data && response.data.ml_request_id) {
      await pool.query(
        `UPDATE learning_requests SET ml_request_id = $1 WHERE id = $2`,
        [response.data.ml_request_id, request.id]
      );
    }

    return response.data;
  } catch (error) {
    console.error(`[Learning] ML service error for request ${request.id}:`, error.message);

    // Check if ML service is unavailable (use mock response)
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log(`[Learning] ML service unavailable, using mock response for request ${request.id}`);
      await handleMockMLResponse(request);
    } else {
      throw error;
    }
  }
}

async function handleMockMLResponse(request) {
  let mockContent = null;

  switch (request.request_type) {
    case 'flashcard':
      mockContent = generateMockFlashcards(request);
      break;
    case 'quiz':
      mockContent = generateMockQuiz(request);
      break;
    case 'notes':
      mockContent = generateMockNotes(request);
      break;
  }

  // Update request with mock content
  await pool.query(
    `UPDATE learning_requests 
     SET status = 'completed', 
         generated_content = $1,
         completed_at = NOW()
     WHERE id = $2`,
    [mockContent, request.id]
  );

  console.log(`[Learning] Mock response generated for request ${request.id}`);
}

function generateMockFlashcards(request) {
  const difficulty = request.preferences?.difficulty || 'medium';
  return [
    {
      question: 'What is the main topic of this content?',
      answer: 'This is a sample answer generated from the study material.',
      difficulty: difficulty,
    },
    {
      question: 'What are the key concepts discussed?',
      answer: 'Key concepts include various important topics from the material.',
      difficulty: difficulty,
    },
    {
      question: 'How does this concept apply in practice?',
      answer: 'This concept can be applied through practical examples and exercises.',
      difficulty: difficulty,
    },
  ];
}

function generateMockQuiz(request) {
  const quizType = request.preferences?.quiz_type || 'mcq';
  const numQuestions = request.preferences?.number_of_questions || 5;

  const questions = [];
  for (let i = 0; i < numQuestions; i++) {
    questions.push({
      question: `Sample question ${i + 1} based on the study material?`,
      type: quizType,
      options: quizType === 'mcq' ? [
        'Option A - First possible answer',
        'Option B - Second possible answer',
        'Option C - Third possible answer',
        'Option D - Fourth possible answer',
      ] : null,
      correct_answer: quizType === 'mcq' ? 'Option A - First possible answer' : 'Sample answer',
      explanation: 'This is the explanation for why this answer is correct.',
    });
  }

  return questions;
}

function generateMockNotes(request) {
  const noteStyle = request.preferences?.note_style || 'summary';

  return {
    title: 'Study Notes',
    style: noteStyle,
    content: noteStyle === 'bullet'
      ? '• Key point 1: Important concept from the material\n• Key point 2: Another crucial topic\n• Key point 3: Additional relevant information'
      : noteStyle === 'detailed'
      ? 'This is a detailed summary of the study material. It includes comprehensive explanations of all major concepts, examples, and practical applications. The content is organized in a logical flow to facilitate understanding and retention.'
      : 'This is a concise summary of the main topics covered in the study material, highlighting the most important concepts and their relationships.',
    summary: 'Quick overview of the key takeaways from this study session.',
  };
}

async function getRequestContext(request) {
  const context = {
    sectionTitle: null,
    resourceType: null,
    resourceTitle: null,
  };

  try {
    // Get section details
    if (request.section_id) {
      const sectionResult = await pool.query(
        'SELECT title FROM study_sections WHERE id = $1',
        [request.section_id]
      );
      if (sectionResult.rows.length > 0) {
        context.sectionTitle = sectionResult.rows[0].title;
      }
    }

    // Get resource details
    if (request.resource_id) {
      const resourceResult = await pool.query(
        'SELECT title, resource_type FROM study_resources WHERE id = $1',
        [request.resource_id]
      );
      if (resourceResult.rows.length > 0) {
        context.resourceTitle = resourceResult.rows[0].title;
        context.resourceType = resourceResult.rows[0].resource_type;
      }
    }
  } catch (error) {
    console.error('[Learning] Failed to get request context:', error);
  }

  return context;
}

async function updateRequestStatus(requestId, status, errorMessage = null) {
  try {
    const query = errorMessage
      ? `UPDATE learning_requests 
         SET status = $1, error_message = $2, updated_at = NOW()
         WHERE id = $3`
      : `UPDATE learning_requests 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`;

    const params = errorMessage ? [status, errorMessage, requestId] : [status, requestId];
    await pool.query(query, params);

    console.log(`[Learning] Request ${requestId} status updated to ${status}`);
  } catch (error) {
    console.error('[Learning] Failed to update request status:', error);
  }
}

async function receiveMLResponse(requestId, mlResponse) {
  try {
    console.log(`[Learning] Received ML response for request:`, requestId);

    const { generated_content, status, error } = mlResponse;

    if (status === 'completed' && generated_content) {
      await pool.query(
        `UPDATE learning_requests 
         SET status = 'completed',
             generated_content = $1,
             ml_response_payload = $2,
             completed_at = NOW()
         WHERE id = $3`,
        [generated_content, mlResponse, requestId]
      );
      console.log(`[Learning] Request ${requestId} completed successfully`);
    } else if (status === 'failed') {
      await pool.query(
        `UPDATE learning_requests 
         SET status = 'failed',
             error_message = $1,
             ml_response_payload = $2
         WHERE id = $3`,
        [error || 'ML processing failed', mlResponse, requestId]
      );
      console.log(`[Learning] Request ${requestId} failed:`, error);
    }

    return { success: true };
  } catch (error) {
    console.error('[Learning] Failed to process ML response:', error);
    throw error;
  }
}

async function getRequest(requestId, userId) {
  const result = await pool.query(
    `SELECT * FROM learning_requests 
     WHERE id = $1 AND user_id = $2`,
    [requestId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Learning request not found');
  }

  return result.rows[0];
}

async function getUserRequests(userId, filters = {}) {
  const { requestType, status, limit = 50, offset = 0 } = filters;

  let query = `
    SELECT lr.*, sr.title as resource_title, ss.title as section_title
    FROM learning_requests lr
    LEFT JOIN study_resources sr ON lr.resource_id = sr.id
    LEFT JOIN study_sections ss ON lr.section_id = ss.id
    WHERE lr.user_id = $1
  `;

  const params = [userId];
  let paramCount = 1;

  if (requestType) {
    paramCount++;
    query += ` AND lr.request_type = $${paramCount}`;
    params.push(requestType);
  }

  if (status) {
    paramCount++;
    query += ` AND lr.status = $${paramCount}`;
    params.push(status);
  }

  query += ` ORDER BY lr.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}

async function getFlashcards(userId, filters = {}) {
  const requests = await getUserRequests(userId, {
    requestType: 'flashcard',
    status: 'completed',
    ...filters,
  });

  // Transform into flashcard format
  const flashcards = [];
  const topics = new Map();

  requests.forEach(request => {
    const content = request.generated_content;
    if (Array.isArray(content)) {
      const topicName = request.section_title || request.resource_title || 'General';
      
      content.forEach(card => {
        flashcards.push({
          id: `${request.id}-${flashcards.length}`,
          question: card.question,
          answer: card.answer,
          difficulty: card.difficulty || 'medium',
          topic: topicName,
          marked: false,
        });
      });

      // Track topic counts
      if (!topics.has(topicName)) {
        topics.set(topicName, { name: topicName, count: 0, color: getTopicColor(topics.size) });
      }
      topics.get(topicName).count += content.length;
    }
  });

  return {
    flashcards,
    topics: Array.from(topics.values()),
  };
}

async function getQuizzes(userId, filters = {}) {
  const requests = await getUserRequests(userId, {
    requestType: 'quiz',
    status: 'completed',
    ...filters,
  });

  return {
    quizzes: requests.map(request => ({
      id: request.id,
      title: request.section_title || request.resource_title || 'Quiz',
      topic: request.section_title || 'General',
      difficulty: request.preferences?.difficulty || 'medium',
      questions: request.generated_content || [],
      timeEstimate: `${(request.generated_content?.length || 5) * 2} min`,
      completed: false,
      createdAt: request.created_at,
    })),
  };
}

async function getNotes(userId, filters = {}) {
  const requests = await getUserRequests(userId, {
    requestType: 'notes',
    status: 'completed',
    ...filters,
  });

  return {
    notes: requests.map(request => {
      const content = request.generated_content || {};
      return {
        id: request.id,
        title: content.title || request.section_title || 'Study Notes',
        content: content.content || '',
        summary: content.summary || '',
        type: request.resource_title ? 'document' : 'lecture',
        tags: [request.section_title, request.preferences?.note_style].filter(Boolean),
        date: new Date(request.created_at).toLocaleDateString(),
        pages: Math.ceil((content.content?.length || 0) / 500),
        color: getTopicColor(0),
        createdAt: request.created_at,
      };
    }),
  };
}

function getTopicColor(index) {
  const colors = [
    'from-purple-500 to-violet-600',
    'from-blue-500 to-cyan-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
  ];
  return colors[index % colors.length];
}

async function verifyResourceOwnership(userId, resourceId) {
  const result = await pool.query(
    'SELECT id FROM study_resources WHERE id = $1 AND user_id = $2',
    [resourceId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Resource not found or access denied');
  }
}

async function verifySectionOwnership(userId, sectionId) {
  const result = await pool.query(
    'SELECT id FROM study_sections WHERE id = $1 AND user_id = $2',
    [sectionId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Section not found or access denied');
  }
}

module.exports = {
  createLearningRequest,
  receiveMLResponse,
  getRequest,
  getUserRequests,
  getFlashcards,
  getQuizzes,
  getNotes,
};
