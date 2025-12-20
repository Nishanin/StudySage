# StudySage Project Architecture Analysis

**Date:** December 20, 2025  
**Status:** Production-Ready Express.js Backend with React Frontend

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Structure](#architecture--structure)
4. [Database Schema](#database-schema)
5. [Backend API Architecture](#backend-api-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Services & Integrations](#services--integrations)
8. [Coding Patterns & Conventions](#coding-patterns--conventions)
9. [ML Integration Points](#ml-integration-points)
10. [Key Features Implementation](#key-features-implementation)

---

## Project Overview

**StudySage** is an AI-powered study companion platform that:
- Enables students to upload study materials (PDFs, PPTs, audio, YouTube videos)
- Uses AI to generate context-aware explanations, notes, flashcards, and quizzes
- Provides real-time chatbot assistance during study sessions
- Tracks learning progress and identifies weak areas
- Maintains AI memory of student preferences, weaknesses, and understanding

### Core Value Proposition
- **Live Lecture Support**: Real-time transcription and understanding of lectures
- **Context-Aware Chat**: AI assistant answers questions based on student's current study material
- **Spaced Repetition**: Automatic flashcard and quiz generation
- **Progress Analytics**: Learning dashboard with insights and recommendations

---

## Technology Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4.18.2)
- **Database:** PostgreSQL with UUID support
- **Vector Store:** Qdrant (semantic search & embeddings)
- **Authentication:** JWT (jsonwebtoken v9.0.2)
- **Security:** Helmet, CORS, compression, rate-limiting
- **File Handling:** Multer (v1.4.5-lts.1) for uploads
- **CLI Tools:** Nodemon (dev), Morgan (logging)

### Frontend
- **Framework:** React (v18.3.1)
- **Build Tool:** Vite
- **UI Components:** Radix UI (comprehensive component library)
- **Styling:** Tailwind CSS
- **Charts:** Recharts (v2.15.2)
- **Forms:** React Hook Form (v7.55.0)
- **Notifications:** Sonner (v2.0.3)
- **Date Picker:** react-day-picker (v8.10.1)
- **Carousels:** Embla (v8.6.0)
- **Utilities:** clsx, class-variance-authority, tailwind-merge

### Infrastructure
- **API Communication:** Fetch API with token-based auth
- **Session Management:** In-memory store + database persistence
- **Error Handling:** Centralized error handler with specific error type detection
- **Logging:** Morgan (HTTP), Custom request logger

---

## Architecture & Structure

### Backend Folder Structure
```
backend/
├── src/
│   ├── app.js                 # Express app setup & middleware
│   ├── server.js              # Server initialization & graceful shutdown
│   ├── db.js                  # PostgreSQL connection pool
│   ├── qdrant.client.js       # Qdrant vector DB client
│   ├── routes.js              # Route aggregator
│   ├── config/
│   │   └── multer.js          # File upload configuration
│   ├── contracts/
│   │   └── memory.api.contract.js  # AI Memory types contract
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.js
│   │   ├── chat.controller.js
│   │   ├── content.controller.js
│   │   ├── context.controller.js
│   │   ├── learning.controller.js
│   │   ├── liveLecture.controller.js
│   │   ├── session.controller.js
│   │   └── upload.controller.js
│   ├── middlewares/           # Express middleware
│   │   ├── index.js           # Central export
│   │   ├── auth.js            # JWT authentication
│   │   ├── asyncHandler.js    # Error wrapping for async handlers
│   │   ├── errorHandler.js    # Global error handler
│   │   ├── notFoundHandler.js # 404 handler
│   │   ├── requestLogger.js   # Request logging
│   │   └── validate.js        # Request validation (Joi)
│   ├── routes/                # Route definitions
│   │   ├── auth.routes.js
│   │   ├── chat.routes.js
│   │   ├── content.routes.js
│   │   ├── context.routes.js
│   │   ├── flashcards.routes.js
│   │   ├── learning.routes.js
│   │   ├── liveLecture.routes.js
│   │   ├── notes.routes.js
│   │   ├── quizzes.routes.js
│   │   ├── session.routes.js
│   │   └── upload.routes.js
│   ├── services/              # Business logic
│   │   ├── context.service.js    # Study context management
│   │   ├── learning.service.js   # Learning content requests
│   │   ├── liveLecture.service.js # Live lecture transcript handling
│   │   ├── memory.service.js      # AI memory persistence
│   │   ├── ml.service.js          # Mock ML integration
│   │   └── session.service.js     # Study session lifecycle
│   └── utils/                 # Utility functions
│       ├── memory.helpers.js
│       └── qdrant.init.js
├── database/
│   └── schema.sql             # Full database schema
├── uploads/                   # File storage directory
└── package.json
```

### Frontend Folder Structure
```
frontend/
├── src/
│   ├── App.jsx                # Main app routing & state management
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
│   ├── components/            # React components
│   │   ├── Auth.jsx
│   │   ├── ChatbotPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Flashcards.jsx
│   │   ├── FloatingChatbot.jsx
│   │   ├── Header.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LiveLectureMode.jsx
│   │   ├── Notes.jsx
│   │   ├── PDFUploader.jsx
│   │   ├── Profile.jsx
│   │   ├── Progress.jsx
│   │   ├── Quizzes.jsx
│   │   ├── Settings.jsx
│   │   ├── Sidebar.jsx
│   │   ├── StudyWorkspace.jsx
│   │   ├── VideoLinkPaster.jsx
│   │   ├── figma/             # Figma design components
│   │   │   └── ImageWithFallback.jsx
│   │   └── ui/                # Radix UI component primitives
│   │       ├── accordion.jsx
│   │       ├── alert.jsx
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── dialog.jsx
│   │       ├── form.jsx
│   │       ├── input.jsx
│   │       └── ... (30+ UI primitives)
│   ├── utils/
│   │   └── api.js             # API client layer
│   ├── styles/
│   │   └── globals.css        # Global CSS
│   └── assets/                # Images, icons, etc.
├── vite.config.js
└── package.json
```

---

## Database Schema

### Core Tables

#### `users`
```sql
id (UUID, PK)
email (VARCHAR, UNIQUE)
password_hash (VARCHAR)
full_name (VARCHAR)
profile_picture_url (TEXT)
is_email_verified (BOOLEAN)
created_at, updated_at, last_login_at (TIMESTAMPS)
is_active (BOOLEAN)
```

#### `study_sections`
```sql
id (UUID, PK)
user_id (UUID, FK → users)
title (VARCHAR)
description (TEXT)
confidence_score (DECIMAL 0-1) -- ML confidence in topic classification
ml_metadata (JSONB) -- { subjects: string[], sections: {...}[] }
created_at, updated_at (TIMESTAMPS)
```

#### `study_resources`
```sql
id (UUID, PK)
user_id, section_id (UUID, FK)
resource_type ('pdf' | 'ppt' | 'youtube' | 'audio')
title (VARCHAR)
file_url, youtube_video_id, youtube_thumbnail_url (TEXT)
duration_seconds, total_pages, file_size_bytes (INT)
extracted_text (TEXT) -- Full text for semantic search
processing_status ('pending' | 'processing' | 'completed' | 'failed')
processing_error (TEXT)
ml_metadata (JSONB) -- { subjects, sections, confidence, extractedAt }
created_at, updated_at (TIMESTAMPS)
```

#### `study_contexts` 
```sql
id (UUID, PK)
user_id (UUID, UNIQUE, FK) -- One context per user (current state)
resource_id (UUID, FK)
current_page (INT) -- For PDFs/PPTs
current_timestamp_seconds (INT) -- For videos/audio
current_view_metadata (JSONB) -- { viewport, zoom, selectedText, etc. }
last_activity_at, created_at, updated_at (TIMESTAMPS)
```

#### `study_sessions`
```sql
id (UUID, PK)
user_id, resource_id, section_id (UUID, FK)
started_at, ended_at (TIMESTAMPS)
duration_seconds (INT)
session_metadata (JSONB) -- { focus_level, distraction_count, topics_covered }
created_at (TIMESTAMP)
```

#### `chat_messages`
```sql
id (UUID, PK)
user_id, session_id (UUID, FK)
role ('user' | 'assistant')
content (TEXT)
context_snapshot (JSONB) -- { resourceId, pageNumber, timestamp }
tokens_used, response_time_ms (INT)
model_name (VARCHAR)
created_at (TIMESTAMP)
```

#### `ai_memory_entries`
```sql
id (UUID, PK)
user_id (UUID, FK)
memory_type ('preference' | 'weakness' | 'habit' | 'concept' | 'fact')
content (TEXT) -- Human-readable memory entry
qdrant_point_id (VARCHAR, UNIQUE) -- Reference to vector in Qdrant
source_resource_id, source_session_id (UUID, FK)
confidence_score (DECIMAL 0-1)
access_count (INT)
last_accessed_at (TIMESTAMP)
metadata (JSONB)
created_at, updated_at (TIMESTAMPS)
CONSTRAINT uq_user_qdrant_point UNIQUE (user_id, qdrant_point_id)
```

#### `live_lecture_sessions`
```sql
id (UUID, PK)
user_id (UUID, FK)
title (VARCHAR)
started_at, ended_at (TIMESTAMPS)
duration_seconds (INT)
full_transcript (TEXT)
word_count (INT)
processing_status ('active' | 'completed' | 'failed')
session_metadata (JSONB) -- { speakerInfo, audioQuality, topics }
created_at, updated_at (TIMESTAMPS)
```

### Indexes Strategy
- **Performance:** Primary keys, user_id lookups, timestamp-based ordering
- **Search:** Full-text index on `study_resources.extracted_text` (tsvector)
- **JSON:** GIN index on `ml_metadata` for JSONB queries
- **Sorting:** Composite indexes on (user_id, created_at DESC)

---

## Backend API Architecture

### Response Format (Standardized)
```javascript
// Success Response
{
  success: true,
  data: {
    // Resource-specific data
  }
}

// Error Response
{
  success: false,
  error: {
    message: "Error description",
    statusCode: 400,
    details?: {} // dev mode only
  }
}
```

### Request/Response Flow
```
Client Request
    ↓
Security Middleware (Helmet, CORS)
    ↓
Body Parser (JSON/Form)
    ↓
Authentication (JWT) [if protected]
    ↓
Route Handler → Controller
    ↓
Service Layer (Business Logic)
    ↓
Database/Vector Store Operations
    ↓
Response Formatter
    ↓
Error Handler (if error occurs)
    ↓
Client Response
```

### API Routes Map

#### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Current user info (protected)

#### Content Management (`/api/content`)
- `POST /upload` - Upload file (PDF/PPT/Audio)
- `POST /youtube` - Add YouTube video
- `GET /sections` - Get user's study sections
- `GET /resources` - Get study resources
- `GET /resources/:id` - Get resource details

#### Chat (`/api/chat`)
- `POST /` - Send chat message with optional memory updates (protected)

#### Context (`/api/context`)
- `PUT /` - Update study context (page, timestamp)
- `GET /` - Get current study context (protected)

#### Session (`/api/session`)
- `POST /end` - End active session
- `GET /active` - Get active session
- `GET /history` - Session history
- `GET /config` - Session configuration

#### Learning (`/api/learning`)
- `POST /flashcards` - Request flashcard generation
- `POST /quizzes` - Request quiz generation
- `POST /notes` - Request notes generation
- `GET /requests` - Get user's requests
- `GET /requests/:requestId` - Check request status
- `POST /ml-callback` - ML service callback handler

#### Live Lecture (`/api/live-lecture`)
- `POST /start` - Start new lecture session
- `POST /transcript` - Append transcript chunk
- `GET /active` - Get active session
- `GET /sessions` - Session history
- `GET /buffer/:sessionId` - Get rolling buffer (last 60s)
- `GET /:sessionId/transcript` - Full transcript
- `POST /:sessionId/end` - End session

#### File Upload (`/api/upload`)
- `POST /file` - Single file upload
- `POST /multiple` - Multiple file upload (max 10)
- `DELETE /:filename` - Delete uploaded file

#### Flashcards (`/api/flashcards`) - Route defined, controller in progress
#### Quizzes (`/api/quizzes`) - Route defined, controller in progress
#### Notes (`/api/notes`) - Route defined, controller in progress

### Health & Status
- `GET /health` - API health check
- `GET /api/status` - API status endpoint
- `GET /` - API info & documentation links

---

## Frontend Architecture

### State Management
The app uses local React state with localStorage for authentication:
```javascript
// App.jsx maintains:
- currentPage (routing)
- isAuthenticated (auth state)
- darkMode (theme)
- uploadedFile (current upload)
- user (user object)
- loadingUser (initial load state)
```

### Component Hierarchy
```
App (root)
├── LandingPage
├── Auth (login/register)
├── Dashboard
│   ├── Sidebar
│   ├── Header
│   └── Content Area
├── StudyWorkspace
│   ├── PDFUploader
│   ├── VideoLinkPaster
│   ├── FloatingChatbot
│   └── Study Content
├── ChatbotPage
├── Notes
├── Flashcards
├── Quizzes
├── Progress
├── Settings
└── Profile
```

### Page Navigation
- **Landing** → "Get Started" → Auth
- **Auth** → Login/Register → Dashboard
- **Dashboard** → Upload content → Workspace
- **Workspace** → Browse resources, chat, generate learning materials
- All pages have logout and navigation options

### API Integration (frontend/src/utils/api.js)
Provides modular API client with these namespaces:
- `authAPI` - Register, login, logout, me()
- `contentAPI` - Upload files, add YouTube, get sections/resources
- `chatAPI` - Send messages
- `contextAPI` - Update/get study context
- `sessionAPI` - Manage sessions
- `learningAPI` - Request flashcards/quizzes/notes
- `liveLectureAPI` - Live lecture session management

### Authentication Flow
```
1. User opens app
2. Check localStorage.authToken
3. If token exists → Verify with /api/auth/me
4. Valid → Load user data & show Dashboard
5. Invalid → Clear token & show Landing Page
6. On login → Store token → Update state → Redirect to Dashboard
7. On logout → Clear token & state → Show Landing Page
```

### Dark Mode
Theme toggle stored in component state (not persisted in current implementation).

---

## Services & Integrations

### Core Services

#### `SessionService` (session.service.js)
**Responsibility:** Manage study session lifecycle  
**Key Methods:**
- `startSession(userId, resourceId, sectionId)` - Create new session
- `updateSessionActivity(userId, resourceId)` - Track activity (auto-start if none active)
- `endSession(userId, sessionId)` - Close session & calculate duration
- `getActiveSession(userId)` - Get current session
- **In-Memory Store:** `activeSessions` Map for fast access
- **Persistence:** PostgreSQL database
- **Timeout Logic:** 5-minute inactivity auto-ends session

#### `ContextService` (context.service.js)
**Responsibility:** Track user's current study position  
**Key Methods:**
- `updateContext(userId, resourceId, position)` - Update position (page/timestamp)
- `getCurrentContext(userId)` - Fetch current context
- **In-Memory Store:** `liveContextStore` Map
- **Persistence:** UPSERT on PostgreSQL (one context per user)
- **Triggers:** Auto-update session activity when context changes

#### `MemoryService` (memory.service.js)
**Responsibility:** Persist AI memory entries (hybrid storage)  
**Key Methods:**
- `persistMemoryUpdate(userId, update)` - Save memory with embedding
- `normalizeUpdate(update)` - Handle camelCase/snake_case compatibility
- **Two-Phase Persistence:**
  1. Upsert embedding to Qdrant (vector store)
  2. Insert metadata to PostgreSQL (relational store)
- **Memory Types:** preference, weakness, habit, concept, fact
- **Generated IDs:** UUIDs for Qdrant `qdrant_point_id`

#### `ML Service` (ml.service.js)
**Current Status:** Deterministic mock implementation  
**Key Functions:**
- `extractSubjectsAndSections(text, resourceType)` - Deterministic ML result based on text hash
- `extractTextFromFile(buffer, resourceType)` - Extract text from PDF/PPT/audio
- `extractYouTubeMetadata(videoId)` - Get YouTube video metadata
- **Mock Approach:** Uses text hash to deterministically select from predefined knowledge base
- **Future Integration:** Replace with actual ML API calls
- **Output Structure:**
  ```javascript
  {
    subjects: ['Mathematics'],
    sections: [
      { title: 'Algebra Fundamentals', confidence: 0.92 },
      { title: 'Calculus Basics', confidence: 0.87 }
    ],
    confidence: 0.88
  }
  ```

#### `LearningService` (learning.service.js)
**Responsibility:** Request learning content generation  
**Features:**
- Create async requests for flashcards/quizzes/notes
- Track request status (pending → processing → completed)
- Handle ML service callbacks
- Store generated content with metadata

---

## Vector Database (Qdrant)

### Collection Schema
**Collection Name:** `ai_memory`  
**Vector Size:** 1536 dimensions  
**Distance Metric:** Cosine similarity  

### Payload Indexes
```
- user_id (keyword) - Filter by user
- memory_type (keyword) - Filter by memory type
- confidence_score (float) - Sort by confidence
```

### Vector Operations
```javascript
// Upsert vector with metadata
await upsertVector({
  id: uuidv4(),
  embedding: [1536 floats],
  userId: userUuid,
  memoryType: 'weakness',
  content: 'Struggles with recursion',
  confidenceScore: 0.87,
  metadata: { source: 'conversation', date: '2025-12-20' }
});

// Search similar vectors
const results = await searchSimilarVectors({
  embedding: [1536 floats],
  userId: userUuid,
  limit: 5,
  scoreThreshold: 0.7
});
```

### Integration Points
- **Chat Controller:** Search for related memories when answering questions
- **Memory Service:** Persist new memories with embeddings
- **Learning Service:** Find relevant context for content generation

---

## Coding Patterns & Conventions

### Error Handling Pattern
```javascript
// 1. Async handler wrapping (prevents unhandled promise rejections)
const myRoute = asyncHandler(async (req, res) => {
  // Just throw errors naturally, asyncHandler catches them
  throw new Error('Something went wrong');
});

// 2. Controller errors are auto-caught and passed to errorHandler middleware
// 3. Error handler formats response consistently
// 4. Development: includes stack trace; Production: generic message
```

### Response Pattern
```javascript
// Success (all endpoints)
res.status(200).json({
  success: true,
  data: { /* resource data */ }
});

// Error (errorHandler middleware)
res.status(400).json({
  success: false,
  error: {
    message: "Validation failed",
    statusCode: 400,
    stack: undefined, // Only in dev
    details: null // Only in dev
  }
});
```

### Authentication Pattern
```javascript
// 1. Client sends Authorization header with Bearer token
Authorization: Bearer <JWT_TOKEN>

// 2. Auth middleware extracts and verifies
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = { id: decoded.userId, email: decoded.email };
  next();
};

// 3. Protected routes use middleware
router.post('/resource', authenticate, controller.createResource);
```

### Database Transaction Pattern
```javascript
// Example from content.controller.js
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // Multiple operations
  await client.query('INSERT INTO study_sections ...');
  await client.query('INSERT INTO study_resources ...');
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Service Layer Pattern
```javascript
// Services encapsulate business logic
// Controllers are thin (request → service → response)
// Example:
const updateContext = asyncHandler(async (req, res) => {
  const context = await ContextService.updateContext(userId, resourceId);
  res.json({ success: true, data: { context } });
});
```

### In-Memory + Async Persistence Pattern
```javascript
// Services maintain in-memory stores for speed
const liveContextStore = new Map();

// Immediate return from memory
liveContextStore.set(userId, context);

// Non-blocking async persistence
await _persistContextAsync(userId, context).catch(err => {
  console.error('Failed to persist:', err); // Log but don't crash
});
```

### Mock ML Pattern (Deterministic)
```javascript
// Uses text hash to seed random number generator
function simpleHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
  }
  return Math.abs(hash);
}

// Same input always produces same output
const hash = simpleHash(text);
const subject = subjectPool[hash % subjectPool.length];
```

### File Upload Pattern
```javascript
// Multer configuration in config/multer.js
// File storage with date-based subdirectories
const storage = multer.diskStorage({
  destination: '/uploads/YYYY-MM-DD/',
  filename: 'timestamp-uuid-sanitizedname.ext'
});

// Filter & validate in middleware
const fileFilter = (req, file, cb) => {
  // Validate MIME type + extension
  // Attach category to file object
  cb(null, true);
};
```

---

## ML Integration Points

### Current Implementation (Mocks)

#### Text Extraction (`extractTextFromFile`)
- **Input:** File buffer + resource type
- **Output:** Extracted text string
- **Status:** Deterministic mock (returns predefined samples based on resource type)

#### Subject & Section Extraction (`extractSubjectsAndSections`)
- **Input:** Text + resource type
- **Output:** 
  ```javascript
  {
    subjects: ['Mathematics'],
    sections: [{ title, confidence }, ...],
    confidence: 0.85
  }
  ```
- **Status:** Deterministic mock using text hash to select from knowledge base

#### YouTube Metadata (`extractYouTubeMetadata`)
- **Input:** YouTube video ID
- **Output:** Duration, title, thumbnail URL
- **Status:** Deterministic mock

#### Chat Response Generation (`mockLLMResponse`)
- **Input:** Structured prompt with message, context, history, memories
- **Output:** Chat response string
- **Status:** Simple template-based mock

#### Embedding Generation (`generateMockEmbedding`)
- **Input:** Text string
- **Output:** 1536-dimensional vector
- **Algorithm:** xorshift32 PRNG seeded by text hash
- **Status:** Deterministic mock (same text → same embedding)

### Future ML Integration Points (Prepared)

#### 1. Real LLM Integration
```javascript
// Currently: mockLLMResponse(prompt)
// Future: Call external LLM API (OpenAI, Claude, etc.)
const response = await llmProvider.generate({
  messages: [{ role, content }, ...],
  model: 'gpt-4',
  temperature: 0.7
});
```

#### 2. Real Embeddings
```javascript
// Currently: generateMockEmbedding(text)
// Future: Use embedding service
const embedding = await embeddingService.embed({
  input: text,
  model: 'text-embedding-3-small'
});
```

#### 3. ML Service Callbacks
- **Endpoint:** `POST /api/learning/ml-callback`
- **Purpose:** Receive completed tasks from async ML worker
- **Payload:**
  ```javascript
  {
    requestId: uuid,
    status: 'completed',
    content: { flashcards: [], quizzes: [], notes: [] },
    metadata: { processingTime, tokensUsed, model }
  }
  ```

#### 4. Memory System Interaction
- **Controller:** `POST /api/chat` accepts `memoryUpdates` array
- **Format:**
  ```javascript
  {
    embedding: [1536],
    memoryType: 'weakness',
    content: 'Struggles with async/await',
    confidenceScore: 0.92,
    metadata: {}
  }
  ```

### API Contract (memory.api.contract.js)
```javascript
const MEMORY_TYPES = {
  PREFERENCE: 'preference',  // "Prefers visual explanations"
  WEAKNESS: 'weakness',      // "Struggles with recursion"
  HABIT: 'habit',            // "Studies in the morning"
  CONCEPT: 'concept',        // "Understands Python loops"
  FACT: 'fact'               // "User is 18 years old"
};
```

---

## Key Features Implementation

### 1. Authentication & Authorization
**Implementation:**
- JWT token generation on login/register
- Token stored in localStorage (client)
- Middleware extracts & verifies token on protected routes
- Token includes userId + email
- Expiration: Configurable (default 7 days)

**Files:**
- `auth.controller.js` - Register, login, user profile
- `middlewares/auth.js` - JWT verification
- `frontend/src/utils/api.js` - Token management

### 2. Content Ingestion
**Supported Formats:**
- PDF (up to 50 MB)
- PowerPoint/PPTX (up to 100 MB)
- Audio: MP3, WAV, M4A (up to 200 MB)
- YouTube videos (metadata + transcription ready)

**Process:**
1. Client uploads file
2. Backend validates MIME type + extension
3. Extract text using ML service
4. Generate subjects/sections using ML
5. Create study section (reuse if exists with high confidence)
6. Create study resource with metadata
7. Return resource ID for client to reference

**Files:**
- `content.controller.js` - Upload & YouTube handlers
- `config/multer.js` - File validation & storage
- `services/ml.service.js` - Text extraction

### 3. Study Context Tracking
**Tracks User's Current Position:**
- Current page number (for PDFs/PPTs)
- Current timestamp (for videos/audio)
- Custom metadata (selected text, zoom level, etc.)

**Features:**
- In-memory fast access
- Async database persistence
- Automatic session activity updates
- UPSERT pattern (one context per user)

**Files:**
- `context.controller.js` - Update/get context
- `services/context.service.js` - Context logic
- Routes: `PUT /api/context`, `GET /api/context`

### 4. Study Sessions
**Tracks Learning Activity:**
- Start time, end time, duration
- Associated resource + section
- Session metadata (focus level, distractions)
- Inactivity timeout (5 minutes)

**Logic:**
- Auto-start session on activity
- Auto-end on 5-minute inactivity
- Duration auto-calculated
- Used for progress tracking & insights

**Files:**
- `session.controller.js` - Session management
- `services/session.service.js` - Session logic
- Routes: `/api/session/*`

### 5. AI Chat with Memory Awareness
**Features:**
- Context-aware responses (current resource)
- Memory-aware responses (past interactions)
- Chat history persistence
- Optional memory updates from ML

**Process:**
1. Client sends message
2. Fetch active session & study context
3. Query Qdrant for related memories (top 5)
4. Build structured prompt with:
   - User message
   - Recent chat history
   - Study context
   - Related memories
5. Generate response (mock LLM)
6. Persist message + context snapshot
7. Process optional memory updates
8. Return response

**Files:**
- `chat.controller.js` - Chat logic
- `services/memory.service.js` - Memory persistence
- Routes: `POST /api/chat`

### 6. Live Lecture Transcription
**Features:**
- Real-time transcript aggregation
- Rolling buffer (last 60 seconds)
- Full transcript storage
- Word count tracking
- Session metadata

**Process:**
1. Start session: `POST /live-lecture/start`
2. Stream transcript chunks: `POST /live-lecture/transcript`
   - Each chunk has offset timestamp + final flag
3. Get active session: `GET /live-lecture/active`
4. Access rolling buffer: `GET /live-lecture/buffer/:sessionId`
5. End session: `POST /live-lecture/:sessionId/end`

**Storage:**
- In-memory rolling buffer (60s chunks)
- Full transcript in PostgreSQL
- Session metadata for future analysis

**Files:**
- `liveLecture.controller.js` - Transcript handlers
- `services/liveLecture.service.js` - Transcript logic
- Routes: `/api/live-lecture/*`

### 7. Learning Content Generation
**Supported Requests:**
- Flashcard generation
- Quiz generation
- Notes/summary generation

**Process:**
1. Client requests: `POST /api/learning/flashcards`
2. System creates async request record
3. Returns request ID immediately
4. Client polls: `GET /api/learning/requests/:requestId`
5. ML service processes (future integration)
6. ML calls callback: `POST /api/learning/ml-callback`
7. System updates request status to completed
8. Client fetches completed content

**Status Tracking:**
- pending → processing → completed/failed
- Stored with resource/session reference
- Configurable timeout

**Files:**
- `learning.controller.js` - Request management
- `services/learning.service.js` - Content logic
- Routes: `/api/learning/*`

### 8. AI Memory System
**Two-Tier Storage:**
- **Qdrant:** Vector embeddings for semantic search
- **PostgreSQL:** Metadata + relationship tracking

**Memory Types:**
- `preference` - Study preferences
- `weakness` - Topics user struggles with
- `habit` - User's study patterns
- `concept` - Topics user understands
- `fact` - General facts about user

**Features:**
- Confidence scoring
- Access frequency tracking
- Source tracking (resource/session)
- Retrieval by similarity
- Integration with chat responses

**Files:**
- `memory.service.js` - Persistence logic
- `qdrant.client.js` - Vector DB operations
- Routes: No direct routes (used by chat)

---

## Environment Variables (.env Configuration)

### Database
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=studysage
DB_SSL=false
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000
DB_CONN_TIMEOUT_MS=5000
```

### Qdrant
```
QDRANT_URL=http://localhost:6333
QDRANT_ENDPOINT=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=ai_memory
EMBEDDING_SIZE=1536
```

### Server
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
```

### Frontend
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Summary of Current State

### ✅ Completed
- [x] Production-grade Express.js backend infrastructure
- [x] PostgreSQL database with comprehensive schema
- [x] JWT authentication system
- [x] File upload handling (PDF, PPT, audio)
- [x] Qdrant vector database integration
- [x] Session & context tracking
- [x] Chat with memory awareness (mock LLM)
- [x] Live lecture transcription system
- [x] Learning content request system (async)
- [x] React frontend with routing & components
- [x] API client layer with all endpoints

### 🔄 Prepared for ML Integration
- [x] Memory service with Qdrant & PostgreSQL
- [x] ML callback endpoint for async processing
- [x] Deterministic mock implementations
- [x] API contracts defined
- [x] Structured prompt builder

### 📋 Next Steps (Not Yet Implemented)
- [ ] Real ML API integration (LLM, embeddings)
- [ ] Actual text extraction from PDFs/PPTs
- [ ] Real YouTube transcription/metadata
- [ ] Flashcard/quiz/notes generation
- [ ] Frontend form validation refinement
- [ ] Analytics dashboard completion
- [ ] Testing framework setup
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Production deployment configuration

---

## Key Takeaways for Extension

### Architectural Principles
1. **Separation of Concerns:** Controllers thin, services thick
2. **Middleware-First:** Security, logging, error handling in middleware
3. **Consistent Responses:** All endpoints return standardized JSON
4. **Async-Safe:** asyncHandler wraps all async routes
5. **Two-Tier Storage:** Fast in-memory + durable database persistence
6. **Hybrid Memory:** Vectors in Qdrant + metadata in PostgreSQL

### When Extending
- Add new routes to `/routes` folder
- Implement controller methods that handle HTTP
- Move business logic to `services/`
- Use `asyncHandler` wrapper on all async controllers
- Query database through `pool` from `db.js`
- Upsert vectors to Qdrant through `qdrant.client.js`
- Leverage existing middleware stack
- Follow response format: `{ success, data }` or `{ success: false, error }`

### Code Organization
- **Routes** define endpoints and which controller methods handle them
- **Controllers** parse requests and call services
- **Services** handle all business logic and database queries
- **Middlewares** handle cross-cutting concerns
- **Models/Types** defined in-line or in API contracts

