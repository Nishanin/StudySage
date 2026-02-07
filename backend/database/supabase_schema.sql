-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_memory_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid,
  qdrant_point_id text NOT NULL UNIQUE,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_memory_entries_pkey PRIMARY KEY (id),
  CONSTRAINT ai_memory_entries_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.study_resources(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.study_resources(id)
);
CREATE TABLE public.learning_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid,
  request_type text NOT NULL CHECK (request_type = ANY (ARRAY['notes'::text, 'quiz'::text, 'flashcards'::text, 'diagram'::text])),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])),
  generated_content jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT learning_requests_pkey PRIMARY KEY (id),
  CONSTRAINT learning_requests_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.study_resources(id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  name text,
  education_level text,
  city text,
  country text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.resource_text_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid,
  chunk_type text NOT NULL CHECK (chunk_type = ANY (ARRAY['page'::text, 'slide'::text, 'timestamp'::text])),
  chunk_index integer NOT NULL,
  content text NOT NULL,
  token_count integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resource_text_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT resource_text_chunks_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.study_resources(id)
);
CREATE TABLE public.study_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid,
  title text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['pdf'::text, 'ppt'::text, 'video'::text, 'live'::text])),
  status text DEFAULT 'uploaded'::text CHECK (status = ANY (ARRAY['uploaded'::text, 'processing'::text, 'ready'::text, 'failed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT study_resources_pkey PRIMARY KEY (id),
  CONSTRAINT study_resources_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.study_workspaces(id)
);
CREATE TABLE public.study_workspaces (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT study_workspaces_pkey PRIMARY KEY (id),
  CONSTRAINT study_workspaces_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);