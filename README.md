# StudySage 📘🤖

**StudySage** is an AI-powered study companion that helps students learn more effectively by listening to lectures, reading PDFs/PPTs, and providing context-aware explanations, summaries, notes, flashcards, and quizzes.

---

## ✨ Core Features

- 🎧 **Live Lecture Transcription** - Capture and transcribe live lectures
- 📄 **Document Processing** - Understand PDF and PPT content in real-time
- 📝 **Smart Notes Generation** - Auto-generate structured study notes with key terms
- 🤖 **Context-Aware Chatbot** - Ask questions about your study material with source-based highlights
- 💡 **AI-Powered Explanations** - Get instant explanations enriched with related concepts
- 🧠 **Study Tools** - Generate flashcards and quizzes for active learning
- 📊 **Progress Tracking** - Monitor learning journey and identify weak areas

---

## 🛠️ Tech Stack

- **Frontend:** React with Vite, Shadcn UI components
- **Backend:** Node.js + Express.js (v4.18.2)
- **Database:** PostgreSQL with UUID keys and JSONB fields
- **Vector DB:** Qdrant (1536-dimensional embeddings)
- **Authentication:** JWT-based
- **Storage:** Multer for file uploads

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL
- Qdrant instance (local or cloud)

### Installation & Running

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Set up environment variables
# Frontend: Create .env with API endpoints
# Backend: Create .env with DATABASE_URL, QDRANT_URL, JWT_SECRET

# Run development servers
cd frontend && npm run dev  # Runs on http://localhost:5173
cd backend && npm run dev   # Runs on http://localhost:5000
```

---

## 📚 Key API Endpoints

### AI Features
- **POST /api/ai/explain** - Generate context-aware explanations with highlights
- **POST /api/ai/notes** - Generate structured study notes from content
- **POST /api/chat** - Chat with AI about study material

### Study Content
- **POST /api/upload** - Upload PDF/PPT files
- **GET /api/content/:resourceId** - Retrieve processed content

For detailed API specifications, see:
- [AI Explanation API](./AI_EXPLANATION_API.md)
- [AI Notes Generation API](./AI_NOTES_GENERATION_API.md)

---

## 📖 Documentation

- **[PROJECT_ARCHITECTURE_ANALYSIS.md](./PROJECT_ARCHITECTURE_ANALYSIS.md)** - System design, database schema, Qdrant integration
- **[AI_EXPLANATION_API.md](./AI_EXPLANATION_API.md)** - Explanation endpoint with highlight mapping
- **[AI_NOTES_GENERATION_API.md](./AI_NOTES_GENERATION_API.md)** - Notes generation pipeline
- **[FINAL_VERIFICATION_CHECKLIST.md](./FINAL_VERIFICATION_CHECKLIST.md)** - Feature completion and verification steps

---

## 🏗️ Architecture Highlights

**Semantic Enrichment:** Uses Qdrant vector database to find related memories and concepts from user's learning history, providing contextual AI responses.

**Deterministic Highlights:** Exact string matching algorithm ensures reproducible highlight positioning in explanations.

**Persistent Learning:** All generated content (explanations, notes, flashcards, quizzes) stored in PostgreSQL with session tracking for future reference.

See [PROJECT_ARCHITECTURE_ANALYSIS.md](./PROJECT_ARCHITECTURE_ANALYSIS.md) for detailed system design.

---

## 👨‍🎓 Academic Project

This project demonstrates practical application of AI in education, combining modern web technologies with machine learning to create an effective study platform.

---

## 📄 License

MIT License
