# AI Notes Generation API Documentation

## Overview

The **POST /api/ai/notes** endpoint generates structured, well-organized study notes from PDF/PPT content with semantic enrichment from related learning memories.

---

## Endpoint Specification

### URL
```
POST /api/ai/notes
```

### Authentication
Required: Bearer JWT token in `Authorization` header

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Request Body

```json
{
  "sessionId": "uuid",           // Required: UUID of the study session
  "resourceId": "uuid",          // Required: UUID of the PDF/PPT resource
  "pageNumber": 5,               // Optional: Page number (defaults to 1)
  "scope": "page"                // Optional: "page" or "selection" (defaults to "page")
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | UUID | Yes | Identifies the study session |
| `resourceId` | UUID | Yes | Identifies the PDF/PPT resource |
| `pageNumber` | Integer | No | Page number to generate notes from (defaults to 1) |
| `scope` | String | No | Either "page" (generate notes for entire page) or "selection" (use selected text from current context). Defaults to "page" |

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "notesId": "550e8400-e29b-41d4-a716-446655440000",
    "notes": "# Study Notes\n\n## Key Concepts\n- Topic A...",
    "summary": "Brief preview of the notes content...",
    "keyTerms": [
      "Key Term 1",
      "Key Term 2",
      "Key Term 3"
    ],
    "relatedConcepts": [
      {
        "type": "memory",
        "content": "Previously learned concept related to current notes",
        "relevanceScore": 0.85
      },
      {
        "type": "flashcard",
        "content": "Related flashcard definition",
        "relevanceScore": 0.72
      }
    ],
    "metadata": {
      "resourceId": "550e8400-e29b-41d4-a716-446655440001",
      "pageNumber": 5,
      "sessionId": "550e8400-e29b-41d4-a716-446655440002",
      "scope": "page",
      "contextEnrichment": {
        "foundRelatedMemories": true,
        "insight": "Found 3 related memories from previous learning sessions"
      },
      "generatedAt": "2024-01-15T10:30:45.123Z",
      "model": "mock-gpt-4",
      "wordCount": 427,
      "responseTimeMs": 1234,
      "tokensUsed": 589
    }
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Invalid sessionId format",
    "field": "sessionId",
    "statusCode": 400
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "No authentication provided",
    "statusCode": 401
  }
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Resource not found",
    "statusCode": 404
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "Failed to generate notes",
    "statusCode": 500
  }
}
```

---

## Logic Flow

### Step 1: Input Validation
- Validate `sessionId` is valid UUID format
- Validate `resourceId` is valid UUID format
- Validate `pageNumber` is positive integer (if provided)
- Validate `scope` is either "page" or "selection"

### Step 2: Content Determination
- **If scope = "page"**: Fetch `content_chunks` for the specified `pageNumber`
- **If scope = "selection"**: Retrieve `selected_text` from `study_contexts` table using `sessionId` and `resourceId`
- Return error 400 if no content available

### Step 3: Semantic Enrichment
- Extract `userId` from authenticated request context
- Query **Qdrant vector database** with the content text:
  - Convert content to embedding
  - Search for semantically similar entries with filters:
    - `user_id = <authenticated_user_id>`
    - `session_id = sessionId` OR broad cross-session search
    - `resource_id = resourceId` (optional, allows cross-resource context)
  - Retrieve up to 5 most relevant results
  - Extract type (memory, flashcard, quiz, lecture notes, etc.)

### Step 4: Prompt Construction
- Build structured prompt object with:
  - **Instruction**: "Generate clear, well-organized study notes from the given content"
  - **Content text**: From step 2
  - **Task type**: "notes"
  - **Scope**: "page" or "selection"
  - **Context metadata**: resourceId, pageNumber, sessionId
  - **Related concepts**: From Qdrant enrichment (mapped to text format)
  - **Format requirements**:
    - Bullet points or structured sections
    - Concise and informative style
    - Include headings for organization
    - Highlight key terms

### Step 5: Notes Generation
- Call `generateMockNotes()` service function (deterministic)
- Returns object with:
  - `notes`: Formatted study notes (markdown or structured text)
  - `summary`: Brief preview (first 100 characters)
  - `wordCount`: Total words in generated notes
  - `keyTerms`: Array of important terms extracted from notes
  - `responseTimeMs`: Generation time (mock: 500-2500ms)
  - `model`: Model identifier ("mock-gpt-4" or real model name in production)
  - `tokensUsed`: Estimated token consumption

### Step 6: Database Persistence
- Store in `learning_requests` table:
  - `id`: Generated UUID (notesId)
  - `user_id`: From authenticated user
  - `resource_id`: From request
  - `request_type`: "notes"
  - `context_text`: Original content text
  - `preferences`: JSON with scope and pageNumber
  - `status`: "completed"
  - `generated_content`: JSON with notes, summary, keyTerms, scope
  - `ml_response_payload`: JSON with metrics (wordCount, model, tokensUsed, responseTimeMs)
- Handle storage failures gracefully (return notes to client even if DB fails)

### Step 7: Response Formatting
- Return 200 OK with structured response containing:
  - `notesId`: UUID for future reference
  - `notes`: Full generated notes
  - `summary`: Brief preview
  - `keyTerms`: Extracted key terms
  - `relatedConcepts`: Enriched concepts with relevance scores
  - `metadata`: Complete context and generation info

---

## Data Model Integration

### Input Source Tables

#### `study_contexts`
```sql
{
  user_id: uuid,
  session_id: uuid,
  resource_id: uuid,
  page_number: integer,
  visible_text: text,
  selected_text: text,  -- Used for scope="selection"
  metadata: jsonb
}
```

#### `content_chunks` (implied structure)
```sql
{
  id: uuid,
  resource_id: uuid,
  page_number: integer,
  chunk_content: text,
  embedding: vector(1536)
}
```

### Output Storage: `learning_requests`

```sql
CREATE TABLE learning_requests (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  request_type varchar(50),      -- "notes", "flashcard", "quiz", etc.
  context_text text,              -- Original content used
  preferences jsonb,              -- {scope, pageNumber}
  status varchar(50),             -- "completed", "pending", "failed"
  generated_content jsonb,        -- {notes, summary, keyTerms, scope, pageNumber, sessionId}
  ml_response_payload jsonb,      -- {wordCount, model, tokensUsed, responseTimeMs}
  created_at timestamp,
  updated_at timestamp
);
```

### Vector Integration: Qdrant

**Search Query Structure:**
```json
{
  "vector": [0.123, -0.456, ...],  // 1536-dimensional embedding
  "filter": {
    "must": [
      {"key": "user_id", "match": {"value": "user-uuid"}},
      {"key": "type", "match": {"value": "memory|flashcard|quiz"}}
    ],
    "should": [
      {"key": "session_id", "match": {"value": "session-uuid"}},
      {"key": "resource_id", "match": {"value": "resource-uuid"}}
    ]
  },
  "limit": 5,
  "with_payload": true
}
```

**Response Payload:**
```json
{
  "id": "memory-uuid",
  "score": 0.85,
  "payload": {
    "user_id": "user-uuid",
    "session_id": "session-uuid",
    "resource_id": "resource-uuid",
    "type": "memory|flashcard|quiz|lecture",
    "content": "Actual memory/flashcard content",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

## Example Usage

### cURL Request
```bash
curl -X POST http://localhost:5000/api/ai/notes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "pageNumber": 3,
    "scope": "page"
  }'
```

### JavaScript/Fetch Request
```javascript
const response = await fetch('/api/ai/notes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId: sessionId,
    resourceId: resourceId,
    pageNumber: 3,
    scope: 'page'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Generated Notes:', data.data.notes);
  console.log('Key Terms:', data.data.keyTerms);
  console.log('Related Concepts:', data.data.relatedConcepts);
}
```

---

## Implementation Details

### File Locations

- **Route Handler**: `backend/src/routes/ai.routes.js`
  - Defines POST /notes endpoint
  - Includes authentication middleware
  - Routes to controller

- **Controller**: `backend/src/controllers/ai.controller.js`
  - `notes()` async handler
  - Validates inputs
  - Orchestrates service layer calls
  - Formats response

- **Service Layer**: `backend/src/services/ai.service.js`
  - `buildNotesPrompt()`: Constructs prompt object
  - `generateMockNotes()`: Deterministic note generation
  - `storeNotes()`: Database persistence
  - Integration with Qdrant for enrichment

### Key Functions

#### `buildNotesPrompt()`
```javascript
function buildNotesPrompt({
  contentText,
  scope,
  relatedMemories,
  resourceId,
  pageNumber,
  sessionId
})
```
**Purpose**: Structure input data into prompt format for AI generation

**Returns**: Object with instruction, content, task type, scope, context, and format requirements

#### `generateMockNotes()`
```javascript
function generateMockNotes(promptObj)
```
**Purpose**: Generate deterministic study notes (mock implementation for testing)

**Returns**: 
```javascript
{
  notes: string,
  summary: string,
  wordCount: number,
  keyTerms: string[],
  responseTimeMs: number,
  model: string,
  tokensUsed: number
}
```

#### `storeNotes()`
```javascript
async function storeNotes(userId, sessionId, resourceId, pageNumber, scope, prompt, response)
```
**Purpose**: Persist generated notes to learning_requests table

**Returns**: 
```javascript
{
  id: notesId,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## Production Considerations

### Real AI Integration
Replace `generateMockNotes()` with actual LLM API calls:
- OpenAI GPT-4 API
- Anthropic Claude API
- Local LLaMA implementation
- Hugging Face models

### Performance Optimization
- Cache frequently requested pages
- Batch process multiple notes requests
- Implement request queuing for high load
- Add response caching for identical requests

### Error Handling
- Graceful fallback if Qdrant is unavailable
- Retry logic for transient failures
- Logging for debugging and monitoring
- User-friendly error messages

### Security
- Validate all user inputs (already implemented)
- Rate limiting per user
- Audit logging for notes generation
- Data encryption at rest and in transit

### Scalability
- Use connection pooling for database
- Implement horizontal scaling for API servers
- Separate Qdrant instance for production
- CDN for static content delivery

---

## Testing

### Test Cases

1. **Valid Request - Page Scope**
   - POST with valid sessionId, resourceId, pageNumber, scope="page"
   - Expected: 200 OK with generated notes

2. **Valid Request - Selection Scope**
   - POST with valid sessionId, resourceId, scope="selection"
   - Expected: 200 OK with notes from selected text

3. **Invalid sessionId Format**
   - POST with malformed UUID
   - Expected: 400 Bad Request with error message

4. **Missing Required Fields**
   - POST without sessionId or resourceId
   - Expected: 400 Bad Request

5. **Unauthorized Access**
   - POST without authentication token
   - Expected: 401 Unauthorized

6. **Resource Not Found**
   - POST with valid format but non-existent resourceId
   - Expected: 404 Not Found

### Sample Test Request
```bash
# Valid request
curl -X POST http://localhost:5000/api/ai/notes \
  -H "Authorization: Bearer valid-token" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "pageNumber": 1,
    "scope": "page"
  }'
```

---

## Monitoring & Logging

### Metrics to Track
- Request count per user
- Average response time
- Success/error rates
- Most frequently requested pages
- Qdrant enrichment hit rates

### Log Events
```javascript
// Request received
console.log(`Notes request: sessionId=${sessionId}, resourceId=${resourceId}, scope=${scope}`);

// Qdrant enrichment
console.log(`Found ${relatedMemories.length} related memories`);

// Database persistence
console.log(`Notes stored with ID: ${notesId}`);

// Errors
console.error(`Failed to generate notes: ${error.message}`);
```

---

## Related Endpoints

- **POST /api/ai/explain** - Generate explanations for selected text
- **POST /api/study/context** - Sync current study context
- **GET /api/learning/sessions/:sessionId** - Retrieve session details
- **GET /api/learning/requests** - List all learning requests for user

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-15 | Initial implementation with mock LLM |
| 1.1 | TBD | Real AI integration |
| 1.2 | TBD | Advanced filtering and sorting |

---

## Support & Troubleshooting

### Common Issues

**Issue**: "No content available for notes generation"
- **Cause**: Page number doesn't exist or scope="selection" with no selected text
- **Solution**: Verify pageNumber is valid and selected_text is populated in study_contexts

**Issue**: "Qdrant connection failed"
- **Cause**: Vector database is down
- **Solution**: Check Qdrant service status, fallback to notes without enrichment

**Issue**: "Database persistence failed"
- **Cause**: Connection pool exhausted
- **Solution**: Notes still returned to client; check database logs for issues

---

## Glossary

- **Scope**: Determines what content to generate notes from (page vs selected text)
- **Enrichment**: Adding related memories/concepts from Qdrant vector search
- **Context Snapshot**: Metadata about the generation request (sessionId, resourceId, pageNumber)
- **Key Terms**: Important concepts extracted from generated notes
- **Relevance Score**: Similarity score (0-1) indicating how related a concept is to the current notes
