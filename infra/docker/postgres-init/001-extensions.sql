-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extensions are installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

