# AI Study Companion – Documentation

## Overview

AI Study Companion is a platform that empowers users to upload learning resources (PDF, PPT, Video, Live Lecture) generate AI-powered study materials and interact with an AI tutor using Retrieval-Augmented Generation (RAG). The system is designed for students and educators seeking automated, context-aware study support.

## Core Capabilities

- Upload and manage study resources (PDF, PPT, Video)
- Automated chunking and embedding of content
- Fast, accurate vector search for relevant information
- AI-generated notes, flashcards, quizzes and mind maps
- Contextual chat with documents using RAG

## High-Level Architecture

- **Frontend:** React SPA (Vite, TailwindCSS, Radix UI) for user interaction and resource management
- **Backend:** Node.js/Express API for authentication, resource orchestration and business logic
- **ML Service:** FastAPI (Python) for document extraction, chunking and LLM-based content generation
- **Databases:**
  - Supabase (Postgres) for structured data (users, resources, messages, etc.)
  - Qdrant for vector search and retrieval
- **LLM Integration:** HuggingFace Inference API for all AI content generation tasks

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, Radix UI
- **Backend:** Node.js, Express
- **ML Service:** FastAPI (Python)
- **Database:** Supabase (Postgres)
- **Vector DB:** Qdrant
- **AI/LLM:** HuggingFace Inference API

---
