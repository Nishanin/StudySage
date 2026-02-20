# AI Study Companion – Documentation

## Overview

AI Study Companion is an AI-powered platform that transforms learning resources into structured and interactive study materials. Users can upload PDFs, PPTs, YouTube videos and live lecture recordings to generate AI-curated notes, flashcards, quizzes and contextual chat responses using Retrieval-Augmented Generation (RAG).

Designed for students and educators seeking automated and context-aware academic support.

## Problem Statement

Students often struggle to:

- Extract key concepts from lengthy study material
- Revise efficiently before exams
- Interact with static learning resources

AI Study Companion bridges this gap by transforming raw content into structured, interactive, and personalized study tools.

## Core Capabilities

- Upload PDFs, PPTs, and Videos
- Live lecture processing
- Automated chunking and embedding of content
- Fast, accurate vector search for relevant information
- AI-generated notes, flashcards, quizzes and mind maps
- Contextual chat with documents using RAG
- Export notes as PDF & DOCX

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

## Team

- **Pratik Morkar**
  [GitHub](https://github.com/username) | [LinkedIn](https://linkedin.com/in/username)
- **Nishant Ninawe**
  [GitHub](https://github.com/Nishanin) | [LinkedIn](...)
- **Surabhi Nikam**
  [GitHub](https://github.com/surabhinikam) | [LinkedIn](...)
- **Piyush Pagar**
  [GitHub](https://github.com/pagarpiyush019-prog) | [LinkedIn](...)

---
