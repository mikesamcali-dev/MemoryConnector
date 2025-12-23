-- Migration: pgvector Partitioning Setup
-- Adds vector column and sets up partitioning for embeddings table

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to existing embeddings table
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS vector VECTOR(1536);

-- Add partition_key column (using trigger instead of generated column)
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS partition_key INT;

-- Create function to calculate partition key
CREATE OR REPLACE FUNCTION calculate_partition_key(p_user_id UUID)
RETURNS INT AS $body$
BEGIN
  RETURN abs(hashtext(p_user_id::text)) % 16;
END;
$body$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate partition_key
CREATE OR REPLACE FUNCTION set_partition_key()
RETURNS TRIGGER AS $body$
BEGIN
  IF NEW.partition_key IS NULL THEN
    NEW.partition_key := calculate_partition_key(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$body$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS embeddings_partition_key_trigger ON embeddings;

-- Create trigger
CREATE TRIGGER embeddings_partition_key_trigger
  BEFORE INSERT OR UPDATE OF user_id ON embeddings
  FOR EACH ROW
  EXECUTE FUNCTION set_partition_key();

-- Update existing rows to have partition_key
UPDATE embeddings 
SET partition_key = calculate_partition_key(user_id)
WHERE partition_key IS NULL;

-- Make partition_key NOT NULL after populating
ALTER TABLE embeddings ALTER COLUMN partition_key SET NOT NULL;

-- Note: Converting existing table to partitioned requires recreating the table
-- For now, we'll use partition_key for query optimization
-- Full partitioning can be done in a separate migration if needed

-- Create HNSW index on vector column (if not exists)
-- Note: This will work on the non-partitioned table
-- For partitioned tables, indexes need to be created on each partition
DO $body$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'embeddings' 
    AND indexname = 'idx_embeddings_vector_hnsw'
  ) THEN
    CREATE INDEX idx_embeddings_vector_hnsw ON embeddings 
    USING hnsw (vector vector_cosine_ops) 
    WITH (m = 16, ef_construction = 64);
  END IF;
END;
$body$;

-- Create index on partition_key for query optimization
CREATE INDEX IF NOT EXISTS idx_embeddings_partition_key ON embeddings(partition_key);

-- Create partition-aware similarity search function
CREATE OR REPLACE FUNCTION search_similar_embeddings(
  p_user_id UUID,
  p_query_vector VECTOR(1536),
  p_limit INT DEFAULT 20
)
RETURNS TABLE (memory_id UUID, similarity FLOAT) AS $body$
DECLARE
  partition_num INT := calculate_partition_key(p_user_id);
BEGIN
  -- Set HNSW search parameter for this query
  PERFORM set_config('hnsw.ef_search', '40', true);
  
  RETURN QUERY
  SELECT e.memory_id, 1 - (e.vector <=> p_query_vector) AS similarity
  FROM embeddings e
  WHERE e.user_id = p_user_id
  AND e.partition_key = partition_num  -- Enables partition pruning
  ORDER BY e.vector <=> p_query_vector
  LIMIT p_limit;
END;
$body$ LANGUAGE plpgsql;

-- Grant execute permission (adjust role name as needed)
-- GRANT EXECUTE ON FUNCTION search_similar_embeddings TO app_user;
