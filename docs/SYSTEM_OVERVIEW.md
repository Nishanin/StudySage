# System Overview

## Architectural Style

This project follows a modular, service-oriented architecture with clear separation of concerns. It combines elements of microservices (distinct backend and ML service), layered API design and Retrieval-Augmented Generation (RAG) for AI-powered features. The architecture is designed for scalability, maintainability and extensibility.

## Component Responsibilities

### Frontend

- **Role:** User interface and experience
- **Responsibilities:**
  - Resource upload and management (PDF, PPT, Video)
  - Initiating AI-powered actions (notes, flashcards, quizzes, mind maps, chat)
  - Displaying results and managing user sessions
  - Communicating with backend via REST APIs (token-based auth)

### Backend

- **Role:** API gateway, business logic, orchestration
- **Responsibilities:**
  - User authentication and authorization (JWT, bcrypt)
  - Resource CRUD, file storage and metadata management
  - Orchestrating ML/LLM tasks by delegating to ml_service
  - Chunking, embedding and upserting vectors to Qdrant
  - Querying vector DB for RAG workflows
  - Managing structured data in Supabase (Postgres)
  - Enforcing security, validation and error handling

### ML Service

- **Role:** AI/ML processing and LLM orchestration
- **Responsibilities:**
  - Document extraction (PDF, PPTX, YouTube transcript)
  - Chunking and preprocessing for embedding
  - Generating embeddings for vector search
  - LLM-powered generation of notes, flashcards, quizzes, mind maps (via HuggingFace Inference API)
  - Strict schema enforcement and output validation

## Databases Used

- **Supabase (Postgres):**
  - Stores all structured data: users, profiles, workspaces, resources, files, text chunks, chat messages, learning requests, AI memory entries
  - Chosen for reliability, relational integrity, and easy integration with Node.js

- **Qdrant (Vector DB):**
  - Stores high-dimensional embeddings of resource chunks
  - Enables fast, semantic search for RAG workflows
  - Integrates with backend via REST API and JS client

## Vector DB Integration

- Backend generates embeddings (via ml_service) for each chunked resource
- Embeddings are upserted to Qdrant, indexed by resource and context (page, slide, timestamp)
- For chat and RAG tasks, backend queries Qdrant for top-k relevant chunks using user query embedding and context filters
- Retrieved chunks are used to build LLM prompts for accurate, context-aware responses

## LLM Integration Flow

- LLM tasks (notes, flashcards, quizzes, mind maps) are initiated by backend via REST calls to ml_service
- ml_service uses HuggingFace Inference API with strict system prompts and schema validation
- Output is validated, retried if necessary, and returned to backend for storage and delivery to frontend
- For chat, backend builds a prompt using retrieved chunks and conversation history, then (future: via ml_service) calls LLM for response

## Sync vs Async Communication

- **Frontend ↔ Backend:** Synchronous REST API calls
- **Backend ↔ ML Service:** Synchronous HTTP calls with timeouts and error handling
- **Backend ↔ Qdrant:** Synchronous vector search via REST/JS client
- **Live Lecture/Chat:** Potential for async/WebSocket communication (in live-lecture module)
- **LLM Tasks:** Synchronous, but with timeouts and retries to handle latency

## High-Level Design Principles

- **Separation of Concerns:** Clear boundaries between UI, API, and ML/AI logic
- **Extensibility:** Modular services and strict schema enforcement allow easy addition of new resource types or AI features
- **Reliability:** Robust error handling, validation and retry logic for ML/LLM tasks
- **Security:** JWT auth, environment-based secrets and validation at every layer
- **Scalability:** Stateless services, externalized storage (Supabase, Qdrant) and service oriented design support scaling
- **Maintainability:** Layered code structure, clear API contracts, and strict output schemas for LLMs

---
