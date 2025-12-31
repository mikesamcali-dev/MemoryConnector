-- AlterTable: Add vector column to embeddings table

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to embeddings table (1536 dimensions for text-embedding-ada-002)
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS vector vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings USING hnsw (vector vector_cosine_ops);