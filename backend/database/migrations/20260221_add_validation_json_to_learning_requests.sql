ALTER TABLE public.learning_requests
ADD COLUMN IF NOT EXISTS validation_json TEXT;
