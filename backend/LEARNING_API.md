# Learning API Documentation

## Overview

The Learning API enables frontend to request AI-generated educational content (flashcards, quizzes, and notes) based on study materials. The backend acts as an orchestrator, storing requests and forwarding them to the ML service for processing.

## Architecture

```
Frontend → Backend (API) → ML Service
                ↓
         PostgreSQL (metadata storage)
```

**Key Features:**
- Non-blocking: Frontend receives immediate acknowledgment
- Asynchronous ML processing: Content generated in background
- Graceful degradation: Mock responses when ML service unavailable
- Request tracking: Status monitoring for all learning requests

---

## API Endpoints

### 1. Create Flashcard Request

**Endpoint:** `POST /api/learning/flashcards`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "resource_id": "uuid (optional)",
  "section_id": "uuid (optional)",
  "context_text": "The text content to generate flashcards from",
  "difficulty": "easy|medium|hard (default: medium)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Flashcard generation request created",
  "data": {
    "request_id": "uuid",
    "status": "pending",
    "created_at": "2025-12-18T10:30:00Z"
  }
}
```

**Example Usage (Frontend):**
```javascript
import { flashcardsAPI } from '../utils/api';

// Create flashcard request from current study context
const response = await flashcardsAPI.createFlashcards(
  resourceId,
  sectionId,
  contextText,
  'medium' // difficulty
);

console.log('Request ID:', response.data.request_id);
```

---

### 2. Create Quiz Request

**Endpoint:** `POST /api/learning/quizzes`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "resource_id": "uuid (optional)",
  "section_id": "uuid (optional)",
  "context_text": "The text content to generate quiz questions from",
  "quiz_type": "mcq|short_answer|mixed (default: mcq)",
  "number_of_questions": 5
}
```

**Validation:**
- `number_of_questions`: Must be between 1 and 20

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Quiz generation request created",
  "data": {
    "request_id": "uuid",
    "status": "pending",
    "created_at": "2025-12-18T10:30:00Z"
  }
}
```

**Example Usage (Frontend):**
```javascript
import { quizzesAPI } from '../utils/api';

const response = await quizzesAPI.createQuiz(
  resourceId,
  sectionId,
  contextText,
  'mcq',  // quiz_type
  10      // number_of_questions
);
```

---

### 3. Create Notes Request

**Endpoint:** `POST /api/learning/notes`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "resource_id": "uuid (optional)",
  "section_id": "uuid (optional)",
  "context_text": "The text content to generate notes from",
  "note_style": "summary|bullet|detailed (default: summary)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Notes generation request created",
  "data": {
    "request_id": "uuid",
    "status": "pending",
    "created_at": "2025-12-18T10:30:00Z"
  }
}
```

**Example Usage (Frontend):**
```javascript
import { notesAPI } from '../utils/api';

const response = await notesAPI.createNotes(
  resourceId,
  sectionId,
  contextText,
  'summary' // note_style
);
```

---

### 4. Get Flashcards

**Endpoint:** `GET /api/flashcards`

**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": "request-id-0",
        "question": "What is the main concept?",
        "answer": "The main concept is...",
        "difficulty": "medium",
        "topic": "Section Name",
        "marked": false
      }
    ],
    "topics": [
      {
        "name": "Section Name",
        "count": 5,
        "color": "from-purple-500 to-violet-600"
      }
    ]
  }
}
```

**Example Usage (Frontend):**
```javascript
import { flashcardsAPI } from '../utils/api';

const { data } = await flashcardsAPI.getFlashcards();
console.log('Total flashcards:', data.flashcards.length);
console.log('Topics:', data.topics);
```

---

### 5. Get Quizzes

**Endpoint:** `GET /api/quizzes`

**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "id": "request-id",
        "title": "Quiz Title",
        "topic": "Section Name",
        "difficulty": "medium",
        "questions": [
          {
            "question": "What is...?",
            "type": "mcq",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A",
            "explanation": "Because..."
          }
        ],
        "timeEstimate": "10 min",
        "completed": false,
        "createdAt": "2025-12-18T10:30:00Z"
      }
    ]
  }
}
```

**Example Usage (Frontend):**
```javascript
import { quizzesAPI } from '../utils/api';

const { data } = await quizzesAPI.getQuizzes();
console.log('Available quizzes:', data.quizzes.length);
```

---

### 6. Get Notes

**Endpoint:** `GET /api/notes`

**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "request-id",
        "title": "Study Notes",
        "content": "Detailed notes content...",
        "summary": "Quick overview...",
        "type": "document|lecture",
        "tags": ["Section Name", "summary"],
        "date": "12/18/2025",
        "pages": 3,
        "color": "from-purple-500 to-violet-600",
        "createdAt": "2025-12-18T10:30:00Z"
      }
    ]
  }
}
```

**Example Usage (Frontend):**
```javascript
import { notesAPI } from '../utils/api';

const { data } = await notesAPI.getNotes();
console.log('Total notes:', data.notes.length);
```

---

### 7. Get Request Status

**Endpoint:** `GET /api/learning/requests/:requestId`

**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "request_type": "flashcard|quiz|notes",
    "status": "pending|processing|completed|failed",
    "generated_content": { /* content when completed */ },
    "error_message": "error details (if failed)",
    "created_at": "2025-12-18T10:30:00Z",
    "completed_at": "2025-12-18T10:31:00Z"
  }
}
```

**Example Usage (Frontend):**
```javascript
import { learningAPI } from '../utils/api';

const { data } = await learningAPI.getRequestStatus(requestId);
console.log('Status:', data.status);
if (data.status === 'completed') {
  console.log('Content:', data.generated_content);
}
```

---

### 8. Get User Requests

**Endpoint:** `GET /api/learning/requests`

**Authentication:** Required (JWT)

**Query Parameters:**
- `type`: Filter by request type (flashcard|quiz|notes)
- `status`: Filter by status (pending|processing|completed|failed)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid",
        "request_type": "flashcard",
        "status": "completed",
        "resource_title": "Chapter 5",
        "section_title": "Introduction",
        "created_at": "2025-12-18T10:30:00Z",
        "completed_at": "2025-12-18T10:31:00Z"
      }
    ],
    "total": 1
  }
}
```

**Example Usage (Frontend):**
```javascript
import { learningAPI } from '../utils/api';

const { data } = await learningAPI.getUserRequests({
  type: 'flashcard',
  status: 'completed',
  limit: 20
});
console.log('Completed flashcard requests:', data.requests);
```

---

### 9. ML Service Callback (Internal)

**Endpoint:** `POST /api/learning/ml-callback`

**Authentication:** Required (JWT) - Called by ML service

**Purpose:** ML service posts results back to this endpoint when content generation completes

**Request Body:**
```json
{
  "request_id": "uuid",
  "status": "completed|failed",
  "generated_content": { /* generated content */ },
  "error": "error message (if failed)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "ML response processed"
}
```

---

## ML Integration Contract

### Backend → ML Service

**Endpoint:** `POST ${ML_SERVICE_URL}/generate`

**Timeout:** 5 seconds (non-blocking)

**Request Body:**
```json
{
  "request_id": "uuid",
  "user_id": "uuid",
  "type": "flashcard|quiz|notes",
  "context": {
    "section": "Section name",
    "content": "Study content text",
    "resource_type": "pdf|ppt|youtube|audio",
    "resource_title": "Resource title"
  },
  "preferences": {
    "difficulty": "easy|medium|hard",
    "quiz_type": "mcq|short_answer|mixed",
    "number_of_questions": 5,
    "note_style": "summary|bullet|detailed"
  }
}
```

**Expected ML Response (Async via Callback):**

For **Flashcards:**
```json
{
  "request_id": "uuid",
  "status": "completed",
  "generated_content": [
    {
      "question": "Question text",
      "answer": "Answer text",
      "difficulty": "medium"
    }
  ]
}
```

For **Quizzes:**
```json
{
  "request_id": "uuid",
  "status": "completed",
  "generated_content": [
    {
      "question": "Question text",
      "type": "mcq",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Explanation text"
    }
  ]
}
```

For **Notes:**
```json
{
  "request_id": "uuid",
  "status": "completed",
  "generated_content": {
    "title": "Note title",
    "style": "summary",
    "content": "Note content text",
    "summary": "Brief overview"
  }
}
```

---

## Database Schema

```sql
CREATE TABLE learning_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES study_resources(id) ON DELETE SET NULL,
    section_id UUID REFERENCES study_sections(id) ON DELETE SET NULL,
    
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('flashcard', 'quiz', 'notes')),
    context_text TEXT NOT NULL,
    preferences JSONB DEFAULT '{}'::jsonb,
    
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    ml_request_id VARCHAR(255),
    ml_request_payload JSONB,
    ml_response_payload JSONB,
    
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    generated_content JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);
```

---

## Error Handling

### ML Service Unavailable

When ML service is unreachable (`ECONNREFUSED`, `ETIMEDOUT`):
- Backend automatically generates **mock content**
- Request status set to `completed`
- Frontend receives placeholder flashcards/quizzes/notes
- Logs indicate mock response used

### Request Failures

**400 Bad Request:**
- Missing required fields (`context_text`)
- Invalid enum values (difficulty, quiz_type, note_style)
- Number validation failures (number_of_questions)

**404 Not Found:**
- Request ID not found
- Resource/section ownership mismatch

**500 Internal Server Error:**
- Database errors
- ML service errors (after retry)

---

## Frontend Integration Guide

### 1. Generate Content from Study Context

```javascript
// In StudyWorkspace or any component with study context
import { flashcardsAPI, quizzesAPI, notesAPI } from '../utils/api';

const generateFlashcards = async () => {
  try {
    const response = await flashcardsAPI.createFlashcards(
      currentResourceId,
      currentSectionId,
      visibleTextContent,
      'medium'
    );
    
    // Show success notification
    showNotification('Flashcards generation started!', 'success');
    
    // Optionally poll for completion
    pollRequestStatus(response.data.request_id);
  } catch (error) {
    showNotification('Failed to generate flashcards', 'error');
  }
};
```

### 2. Fetch and Display Content

```javascript
// In Flashcards component
import { flashcardsAPI } from '../utils/api';

useEffect(() => {
  const fetchFlashcards = async () => {
    setLoading(true);
    try {
      const { data } = await flashcardsAPI.getFlashcards();
      setFlashcards(data.flashcards);
      setTopics(data.topics);
    } catch (error) {
      console.error('Failed to fetch flashcards:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchFlashcards();
}, []);
```

### 3. Poll Request Status (Optional)

```javascript
import { learningAPI } from '../utils/api';

const pollRequestStatus = async (requestId) => {
  const maxAttempts = 30; // 30 attempts
  const interval = 2000; // 2 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await learningAPI.getRequestStatus(requestId);
    
    if (data.status === 'completed') {
      showNotification('Content ready!', 'success');
      // Refresh the list
      refreshContent();
      break;
    } else if (data.status === 'failed') {
      showNotification('Generation failed', 'error');
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};
```

---

## Performance Considerations

1. **Non-blocking Design:** Frontend never waits for ML processing
2. **Immediate Acknowledgment:** Request ID returned within milliseconds
3. **Graceful Degradation:** Mock content when ML unavailable
4. **Database Indexing:** Fast queries on user_id, resource_id, status
5. **Timeout Protection:** ML requests timeout after 5 seconds

---

## Testing Checklist

- [ ] Create flashcard request with valid data
- [ ] Create quiz request with all quiz types (mcq, short_answer, mixed)
- [ ] Create notes request with all styles (summary, bullet, detailed)
- [ ] Validate input constraints (difficulty, quiz_type, number_of_questions)
- [ ] Test with ML service running (real generation)
- [ ] Test with ML service down (mock responses)
- [ ] Fetch flashcards/quizzes/notes from completed requests
- [ ] Poll request status until completion
- [ ] Test resource/section ownership validation
- [ ] Test with missing optional fields (resource_id, section_id)

---

## Environment Variables

```bash
# ML Service Configuration
ML_SERVICE_URL=http://localhost:5000/api/ml
```

---

## Future Enhancements

1. **Retry Logic:** Automatic retry for failed ML requests
2. **Batch Requests:** Generate multiple content types in one call
3. **Priority Queue:** Urgent requests processed first
4. **Caching:** Avoid regenerating identical content
5. **WebSocket Updates:** Real-time status updates to frontend
6. **Content Rating:** User feedback on quality
7. **Version History:** Track content revisions

---

## Support

For issues or questions:
- Check server logs: `[Learning]` prefix
- Verify database schema applied
- Ensure ML service reachable
- Validate JWT authentication working
