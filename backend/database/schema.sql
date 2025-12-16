CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    profile_picture_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

CREATE TABLE study_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    ml_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_study_sections_user_id ON study_sections(user_id);
CREATE INDEX idx_study_sections_created_at ON study_sections(created_at DESC);
CREATE INDEX idx_study_sections_confidence ON study_sections(confidence_score DESC);
CREATE INDEX idx_study_sections_ml_metadata ON study_sections USING gin(ml_metadata);

CREATE TABLE study_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES study_sections(id) ON DELETE CASCADE,
    
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('pdf', 'ppt', 'youtube', 'audio')),
    
    title VARCHAR(500) NOT NULL,
    
    file_url TEXT,
    
    youtube_video_id VARCHAR(50),
    youtube_thumbnail_url TEXT,
    
    duration_seconds INTEGER,
    
    total_pages INTEGER,
    
    file_size_bytes BIGINT,
    
    extracted_text TEXT,
    
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_error TEXT,
    
    ml_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_study_resources_user_id ON study_resources(user_id);
CREATE INDEX idx_study_resources_section_id ON study_resources(section_id);
CREATE INDEX idx_study_resources_type ON study_resources(resource_type);
CREATE INDEX idx_study_resources_status ON study_resources(processing_status);
CREATE INDEX idx_study_resources_created_at ON study_resources(created_at DESC);
CREATE INDEX idx_study_resources_text_search ON study_resources USING gin(to_tsvector('english', extracted_text));

CREATE TABLE study_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES study_resources(id) ON DELETE SET NULL,
    
    current_page INTEGER, -- For PDFs/PPTs
    current_timestamp_seconds INTEGER, -- For videos/audio
    
    current_view_metadata JSONB DEFAULT '{}'::jsonb,
    
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_study_contexts_user_id ON study_contexts(user_id);
CREATE INDEX idx_study_contexts_resource_id ON study_contexts(resource_id);
CREATE INDEX idx_study_contexts_last_activity ON study_contexts(last_activity_at DESC);

CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES study_resources(id) ON DELETE SET NULL,
    section_id UUID REFERENCES study_sections(id) ON DELETE SET NULL,
    
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    duration_seconds INTEGER,
    
    session_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_resource_id ON study_sessions(resource_id);
CREATE INDEX idx_study_sessions_section_id ON study_sessions(section_id);
CREATE INDEX idx_study_sessions_started_at ON study_sessions(started_at DESC);
CREATE INDEX idx_study_sessions_duration ON study_sessions(duration_seconds DESC);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    
    content TEXT NOT NULL,
    
    context_snapshot JSONB DEFAULT '{}'::jsonb,
    
    tokens_used INTEGER,
    
    model_name VARCHAR(100),
    
    response_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);

CREATE TABLE ai_memory_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN ('preference', 'weakness', 'habit', 'concept', 'fact')),
    
    content TEXT NOT NULL,
    
    embedding vector(1536), -- OpenAI ada-002 dimension, adjust as needed
    
    source_resource_id UUID REFERENCES study_resources(id) ON DELETE SET NULL,
    source_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_memory_user_id ON ai_memory_entries(user_id);
CREATE INDEX idx_ai_memory_type ON ai_memory_entries(memory_type);
CREATE INDEX idx_ai_memory_confidence ON ai_memory_entries(confidence_score DESC);
CREATE INDEX idx_ai_memory_access_count ON ai_memory_entries(access_count DESC);
CREATE INDEX idx_ai_memory_embedding ON ai_memory_entries USING hnsw (embedding vector_cosine_ops);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'en',
    
    preferred_study_duration_minutes INTEGER DEFAULT 25,
    break_duration_minutes INTEGER DEFAULT 5,
    
    chatbot_voice_enabled BOOLEAN DEFAULT TRUE,
    chatbot_personality VARCHAR(50) DEFAULT 'neutral',
    
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    
    custom_preferences JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_sections_updated_at BEFORE UPDATE ON study_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_resources_updated_at BEFORE UPDATE ON study_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_contexts_updated_at BEFORE UPDATE ON study_contexts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_memory_updated_at BEFORE UPDATE ON ai_memory_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE VIEW user_study_stats AS
SELECT 
    u.id AS user_id,
    u.email,
    COUNT(DISTINCT ss.id) AS total_sections,
    COUNT(DISTINCT sr.id) AS total_resources,
    COUNT(DISTINCT ses.id) AS total_sessions,
    COALESCE(SUM(ses.duration_seconds), 0) AS total_study_time_seconds,
    COUNT(DISTINCT cm.id) FILTER (WHERE cm.role = 'user') AS total_questions_asked,
    MAX(ses.started_at) AS last_study_session
FROM users u
LEFT JOIN study_sections ss ON u.id = ss.user_id
LEFT JOIN study_resources sr ON u.id = sr.user_id
LEFT JOIN study_sessions ses ON u.id = ses.user_id
LEFT JOIN chat_messages cm ON u.id = cm.user_id
GROUP BY u.id, u.email;

CREATE VIEW resource_processing_status AS
SELECT 
    resource_type,
    processing_status,
    COUNT(*) AS count,
    AVG(file_size_bytes) AS avg_file_size,
    SUM(file_size_bytes) AS total_size
FROM study_resources
GROUP BY resource_type, processing_status;

COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON TABLE study_sections IS 'Auto-generated study sections inferred by ML from content';
COMMENT ON TABLE study_resources IS 'Study materials (PDFs, PPTs, videos, audio) with metadata';
COMMENT ON TABLE study_contexts IS 'Current study state (active resource, page/timestamp)';
COMMENT ON TABLE study_sessions IS 'Study time tracking and session analytics';
COMMENT ON TABLE chat_messages IS 'Conversation history between user and AI chatbot';
COMMENT ON TABLE ai_memory_entries IS 'AI long-term memory metadata with embeddings';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for authentication';
COMMENT ON TABLE user_preferences IS 'User settings and preferences';
