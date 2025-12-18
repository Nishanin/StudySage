

# Live Lecture API Integration

Real-time transcript ingestion for live lectures with Speech-to-Text.

## Architecture

**Frontend (Browser)**
- Uses Web Speech API (`SpeechRecognition`) for continuous STT
- Captures final transcript chunks every ~2 seconds (throttled)
- Sends incremental chunks to backend via REST API

**Backend (Express + PostgreSQL)**
- Receives transcript chunks via REST endpoints
- Maintains rolling buffer (last 60 seconds) in memory
- Persists full transcript history in database
- Provides session management and transcript retrieval

## Database Schema

### `live_lecture_sessions`
- Primary session entity tracking lecture recording
- Stores full transcript, duration, word count
- Status: `active`, `completed`, `failed`

### `live_lecture_transcripts`
- Individual transcript chunks in sequence
- Each chunk has: text, sequence number, timestamp offset, word count
- Enables reconstruction of full transcript in order

## API Endpoints

### Start Session
```
POST /api/live-lecture/start
Authorization: Bearer <token>

Request:
{
  "title": "Optional lecture title"
}

Response:
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "userId": "uuid",
      "title": "...",
      "startedAt": "2025-12-18T...",
      "processingStatus": "active"
    }
  }
}
```

### Append Transcript Chunk
```
POST /api/live-lecture/transcript
Authorization: Bearer <token>

Request:
{
  "sessionId": "uuid",
  "transcriptText": "This is a transcript chunk",
  "timestampOffsetMs": 5000,
  "isFinal": true
}

Response:
{
  "success": true,
  "data": {
    "transcript": {
      "id": "uuid",
      "sequenceNumber": 42,
      "wordCount": 5,
      "createdAt": "..."
    },
    "rollingBuffer": {
      "chunks": 10,
      "totalWords": 234
    }
  }
}
```

### End Session
```
POST /api/live-lecture/:sessionId/end
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "startedAt": "...",
      "endedAt": "...",
      "durationSeconds": 1234,
      "wordCount": 5678,
      "processingStatus": "completed"
    }
  }
}
```

### Get Active Session
```
GET /api/live-lecture/active
Authorization: Bearer <token>

Response (if exists):
{
  "success": true,
  "data": {
    "session": { ... }
  }
}

Response (if none):
{
  "success": false,
  "error": {
    "message": "No active session found",
    "statusCode": 404
  }
}
```

### Get Full Transcript
```
GET /api/live-lecture/:sessionId/transcript
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "fullTranscript": "Complete concatenated transcript...",
    "chunks": [
      {
        "id": "uuid",
        "text": "...",
        "sequenceNumber": 1,
        "timestampOffsetMs": 0,
        "wordCount": 10,
        "isFinal": true,
        "createdAt": "..."
      }
    ],
    "totalChunks": 50,
    "totalWords": 500
  }
}
```

### Get Rolling Buffer
```
GET /api/live-lecture/buffer/:sessionId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "buffer": [
      {
        "text": "...",
        "offsetMs": 5000,
        "sequenceNumber": 42
      }
    ],
    "chunks": 10,
    "totalWords": 234
  }
}
```

### Get Session History
```
GET /api/live-lecture/sessions?limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "title": "...",
        "startedAt": "...",
        "endedAt": "...",
        "durationSeconds": 1234,
        "wordCount": 5678,
        "processingStatus": "completed"
      }
    ],
    "total": 5
  }
}
```

## Frontend Integration

### API Client (`liveLectureAPI`)

```javascript
import { liveLectureAPI } from '../utils/api';

// Start session
const response = await liveLectureAPI.startSession('My Lecture');
const session = response.data.session;

// Send transcript (throttled to every 2 seconds)
await liveLectureAPI.appendTranscript(
  sessionId,
  transcriptText,
  timestampOffsetMs,
  isFinal
);

// End session
await liveLectureAPI.endSession(sessionId);

// Get active session
const activeSession = await liveLectureAPI.getActiveSession();

// Get full transcript
const transcript = await liveLectureAPI.getFullTranscript(sessionId);
```

### LiveLectureMode Component

**Key Features:**
- Auto-creates session on "Start Listening"
- Throttles transcript sending (2-second batches)
- Flushes pending transcript on pause/stop
- Auto-ends session on stop or unmount
- Shows live word count
- Gracefully handles backend failures (continues recording)

**Transcript Flow:**
1. User clicks "Start Listening"
2. Component creates live lecture session via API
3. Browser STT captures audio → generates final transcript chunks
4. Component throttles and batches chunks (every 2 seconds)
5. Sends batch to backend via `POST /live-lecture/transcript`
6. Backend appends to database and updates rolling buffer
7. User clicks "Stop Listening"
8. Component flushes pending transcript
9. Component ends session via API
10. Backend builds full transcript and marks session complete

## Backend Service Layer

### Rolling Buffer (`activeSessionBuffers`)
- In-memory Map keyed by `sessionId`
- Stores last 60 seconds of transcript chunks
- Cleanup runs every 10 seconds per session
- Stale buffer cleanup runs every 30 minutes globally

### Non-blocking Design
- Transcript append returns immediately
- Word count update happens in background (non-blocking)
- Buffer cleanup is throttled
- No heavy ML processing in critical path

## Validation & Error Handling

### Backend Validation
- `transcriptText` must be non-empty string
- `timestampOffsetMs` must be non-negative number
- `sessionId` must reference existing session owned by user

### Frontend Error Handling
- Backend failures logged but don't stop recording
- Session creation failure prevents recognition start
- Cleanup operations use `.catch()` to avoid unhandled rejections

## Future ML Integration

### Prepared for:
- Real-time topic extraction from rolling buffer
- Sentiment analysis on transcript chunks
- Key concept identification
- Summary generation on session end
- Semantic embeddings for search

### Integration Points:
- **Rolling Buffer API**: Access last 60s for real-time ML
- **Full Transcript API**: Batch processing after session
- **Transcript Chunks**: Incremental processing as data arrives

### Design Principles:
- ML calls should be async/non-blocking
- Don't delay transcript storage for ML processing
- Store ML outputs in separate tables/services
- Use message queues for heavy ML workloads

## Performance Considerations

### Frontend
- Throttle: 2-second batches (adjustable)
- No transcript stored permanently in React state
- Pending transcript cleared on flush

### Backend
- Fast inserts: Single row per chunk
- Indexed queries: `session_id + sequence_number`
- Rolling buffer: In-memory, bounded by time
- Background updates: Word count aggregation

### Database
- Indexes on: `user_id`, `session_id`, `sequence_number`, `created_at`
- Partitioning opportunity: `created_at` for old sessions
- Archive strategy: Move completed sessions to cold storage

## Testing Checklist

- [ ] Start session → verify session created in DB
- [ ] Speak → verify transcript chunks arrive at backend
- [ ] Check sequence numbers are incrementing
- [ ] Verify rolling buffer contains last 60s
- [ ] Pause → verify pending transcript flushed
- [ ] Resume → verify new chunks continue sequence
- [ ] Stop → verify session marked complete
- [ ] Full transcript → verify all chunks in order
- [ ] Multiple sessions → verify isolation
- [ ] Network failure → verify frontend continues recording

## Troubleshooting

### "Session not found" errors
- Check user owns the session
- Verify session hasn't been ended already
- Check `liveSession` state in frontend

### Transcript chunks missing
- Check throttle timer is flushing
- Verify backend authentication
- Check database constraints

### Sequence numbers out of order
- Buffer tracks sequence per session
- Check session initialization in service
- Verify no concurrent session creation

### Memory leaks
- Rolling buffer auto-cleans every 10s
- Stale session cleanup runs every 30min
- Check `activeSessionBuffers` size in production

## Security

- All endpoints require JWT authentication
- User can only access their own sessions
- Input validation on all transcript fields
- No user-generated SQL (parameterized queries)
- Rolling buffer scoped per session (no cross-user leaks)
