-- Migration: Make Words Standalone Entities
-- This migration converts words from being memory-based (1:1) to standalone entities (many:1)

BEGIN;

-- Step 1: Add word_id column to memories table
ALTER TABLE memories ADD COLUMN word_id UUID;
CREATE INDEX idx_memories_word_id ON memories(word_id);

-- Step 2: Add id column to words table (nullable for now)
ALTER TABLE words ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Step 3: Handle duplicate words by keeping only one and merging references
-- First, identify duplicates and keep the oldest one for each word
WITH duplicates AS (
  SELECT
    word,
    MIN(memory_id) as keep_memory_id,
    ARRAY_AGG(memory_id) FILTER (WHERE memory_id != MIN(memory_id)) as remove_memory_ids
  FROM words
  GROUP BY word
  HAVING COUNT(*) > 1
),
-- Update all memory_links that point to duplicate word memories to point to the kept one
link_updates AS (
  UPDATE memory_links ml
  SET target_id = d.keep_memory_id
  FROM duplicates d
  WHERE ml.target_id = ANY(d.remove_memory_ids)
  RETURNING ml.id
)
-- Delete duplicate word entries (the words table entries will be cleaned up later)
DELETE FROM words
WHERE memory_id IN (
  SELECT UNNEST(remove_memory_ids)
  FROM duplicates
  WHERE remove_memory_ids IS NOT NULL
);

-- Step 4: Set the id for remaining words
UPDATE words SET id = gen_random_uuid() WHERE id IS NULL;

-- Step 5: Make word column unique and id NOT NULL
ALTER TABLE words ALTER COLUMN id SET NOT NULL;
ALTER TABLE words ADD CONSTRAINT words_word_unique UNIQUE (word);

-- Step 6: For each memory that has a word entry, set the memory's word_id
-- This connects regular memories to words
UPDATE memories m
SET word_id = w.id
FROM words w
WHERE w.memory_id = m.id;

-- Step 7: For each memory that links to a word memory, set its word_id instead
-- This converts memory_links to word relationships
WITH word_links AS (
  SELECT
    ml.source_id as memory_id,
    w.id as word_id
  FROM memory_links ml
  JOIN words w ON ml.target_id = w.memory_id
  WHERE ml.link_type = 'related'
)
UPDATE memories m
SET word_id = wl.word_id
FROM word_links wl
WHERE m.id = wl.memory_id;

-- Step 8: Delete memory_links that were converted to word relationships
DELETE FROM memory_links ml
USING words w
WHERE ml.target_id = w.memory_id;

-- Step 9: Delete word memories from memories table (they're now standalone in words table)
DELETE FROM memories
WHERE id IN (SELECT memory_id FROM words);

-- Step 10: Drop the old primary key and create new one on words table
ALTER TABLE words DROP CONSTRAINT words_pkey;
ALTER TABLE words DROP COLUMN memory_id;
ALTER TABLE words ADD PRIMARY KEY (id);

-- Step 11: Add foreign key constraint from memories to words
ALTER TABLE memories
  ADD CONSTRAINT fk_memories_word
  FOREIGN KEY (word_id)
  REFERENCES words(id)
  ON DELETE SET NULL;

COMMIT;
