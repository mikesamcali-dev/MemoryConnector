-- Migration: Full-Text Search Setup
-- Adds tsvector column and GIN index for keyword search fallback

-- Add tsvector column for full-text search
ALTER TABLE memories ADD COLUMN IF NOT EXISTS text_search_vector TSVECTOR;

-- Populate existing data
UPDATE memories 
SET text_search_vector = to_tsvector('english', COALESCE(text_content, ''))
WHERE text_search_vector IS NULL;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_memories_fts ON memories USING GIN(text_search_vector);

-- Create trigger function to auto-update tsvector
CREATE OR REPLACE FUNCTION update_text_search_vector()
RETURNS TRIGGER AS $body$
BEGIN
  NEW.text_search_vector := to_tsvector('english', COALESCE(NEW.text_content, ''));
  RETURN NEW;
END;
$body$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS memories_text_search_update ON memories;

-- Create trigger
CREATE TRIGGER memories_text_search_update
  BEFORE INSERT OR UPDATE OF text_content ON memories
  FOR EACH ROW
  EXECUTE FUNCTION update_text_search_vector();