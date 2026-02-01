# StudySage 📘🤖

**StudySage** is an AI-powered study companion that helps students learn more effectively by listening to lectures, reading PDFs/PPTs, and providing context-aware explanations, summaries, notes, flashcards, and quizzes.

---

## ✨ Core Features

- 🎧 **Live Lecture Transcription** - Capture and transcribe live lectures
- 📄 **Document Processing** - Understand PDF and PPT content with OCR for scanned documents
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
- **OCR Engine:** Tesseract.js v5.1.0 (scanned PDF text extraction)
- **Image Processing:** ImageMagick (PDF to PNG conversion)
- **Authentication:** JWT-based
- **File Processing:** Multer for uploads, pdf-parse for PDF text detection

---

## 🚀 Getting Started

### Prerequisites

#### System Requirements
- **Node.js:** v18 or higher
- **npm:** v9 or higher
- **PostgreSQL:** v13 or higher
- **ImageMagick:** v7.0+ (for scanned PDF processing)
- **Qdrant:** Local instance or cloud access

#### Installation Steps

##### 1. Clone the Repository
```bash
git clone <repository-url>
cd StudySage
```

##### 2. Install System Dependencies

**Windows:**
```bash
# Download and install ImageMagick from:
# https://imagemagick.org/script/download.php#windows
# Or use chocolatey:
choco install imagemagick
```

**macOS:**
```bash
brew install imagemagick qdrant
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install imagemagick
# For Qdrant, see: https://qdrant.tech/documentation/quick-start/
```

##### 3. Backend Setup
```bash
cd backend
npm install

# Create .env file with:
cat > .env << EOF
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=studysage
DB_USER=postgres
DB_PASSWORD=your_password

# Qdrant
QDRANT_URL=http://localhost:6333

# JWT
JWT_SECRET=your_secret_key

# Port
PORT=5000

# AI/LLM
GROQ_API_KEY=your_groq_key
EOF

# Run database migrations
npm run migrate

# Start backend server
npm run dev  # Development mode
npm start    # Production mode
```

##### 4. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env file with:
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:5000
EOF

# Start frontend development server
npm run dev  # Runs on http://localhost:5173

# For production build:
npm run build  # Creates dist/ folder
```

---

## 📊 Database Setup

### PostgreSQL Database
```bash
# Create database
createdb studysage

# Run schema (located in backend/database/schema.sql)
psql studysage < backend/database/schema.sql

# Tables created:
# - users (authentication)
# - sessions (learning sessions)
# - documents (uploaded PDFs/PPTs)
# - document_ocr_jobs (OCR processing status)
# - document_ocr_results (extracted text from scanned documents)
# - chat_messages (conversation history)
# - notes (generated study notes)
# - flashcards (study flashcards)
# - quizzes (auto-generated quizzes)
# - memories (semantic learning memories)
```

### Qdrant Vector Database
```bash
# Start Qdrant (Docker recommended)
docker run -p 6333:6333 qdrant/qdrant:latest

# Or install locally and run:
qdrant  # Binary will start on port 6333
```

---

## 📚 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Document Management
- `POST /api/upload` - Upload PDF/PPT file
- `GET /api/content/:resourceId` - Get document content
- `GET /api/documents` - List user documents

### AI Features
- `POST /api/ai/explain` - Generate context-aware explanations
- `POST /api/ai/notes` - Generate structured study notes
- `POST /api/chat` - Chat with AI about study material

### Study Tools
- `POST /api/flashcards/generate` - Generate flashcards
- `POST /api/quizzes/generate` - Generate quizzes
- `GET /api/progress` - Get learning progress

### OCR Processing
- `POST /api/ocr/check-and-process/:resourceId` - Trigger OCR for scanned PDFs
- `GET /api/ocr/job/:jobId` - Check OCR job status
- `GET /api/ocr/results/:jobId` - Get extracted text

---

## 🏗️ Architecture Highlights

**AI-Powered Learning:** Uses OpenAI/Groq API for generating explanations, notes, and study questions.

**Scanned Document Support:** Tesseract.js OCR engine automatically extracts text from scanned PDFs and images with per-page processing.

**Vector Embeddings:** Qdrant database stores semantic embeddings for context retrieval and concept linking.

**Real-time Processing:** Async job orchestration for OCR processing with database persistence and frontend status updates.

**Session Tracking:** All user activities tracked in PostgreSQL for personalized learning recommendations.

---

## 🧪 Testing the System

### Test File Upload
```bash
# Use curl or your API client to upload a PDF:
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@sample.pdf"
```

### View Extracted OCR Results
```bash
curl http://localhost:5000/api/ocr/results/JOB_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Generate AI Explanation
```bash
curl -X POST http://localhost:5000/api/ai/explain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "resourceId": "DOCUMENT_ID",
    "topic": "Neural Networks",
    "context": "Machine Learning Chapter 3"
  }'
```

---

## 🐛 Troubleshooting

### ImageMagick Not Found
```bash
# Add to system PATH or specify full path in .env:
MAGICK_PATH=/usr/local/bin/magick  # macOS
MAGICK_PATH=C:\\Program Files\\ImageMagick-7.1.2\\magick.exe  # Windows
```

### Database Connection Errors
```bash
# Verify PostgreSQL is running:
psql -U postgres -h localhost -c "SELECT version();"

# Check .env DATABASE_URL format:
# postgresql://user:password@localhost:5432/studysage
```

### Qdrant Connection Issues
```bash
# Verify Qdrant is running:
curl http://localhost:6333/health
```

### OCR Not Processing
```bash
# Verify ImageMagick installation:
magick --version

# Check Tesseract.js logs in backend console
# Ensure PDF file is not corrupted
```

---

## 📦 Project Structure

```
StudySage/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── controllers/       # Business logic
│   │   ├── services/          # OCR, AI, database services
│   │   ├── middlewares/       # Auth, error handling
│   │   └── utils/             # Helper functions
│   ├── database/              # PostgreSQL schemas
│   └── package.json
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── utils/             # API client, helpers
│   │   └── styles/            # Global CSS
│   └── package.json
└── README.md
```

---

## 🚢 Deployment

### Production Build
```bash
# Frontend
cd frontend && npm run build  # Creates optimized dist/

# Backend
cd backend && npm install --production
# Run with: npm start
```

### Environment Variables (Production)
Ensure all sensitive keys are set via:
- Environment variables
- `.env` file (never commit to git)
- Secret management service (AWS Secrets Manager, etc.)

---

## 📄 License

See LICENSE file for details.

---

## 👨‍💻 Contributing

Contributions welcome! Please follow the existing code structure and add tests for new features.

---

**Made with ❤️ for effective learning**

MIT License
