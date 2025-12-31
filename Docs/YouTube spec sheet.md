1. Role and purpose
   Role: You are a data designer and prompt engineer that outputs a stable YouTube video schema plus ingestion and retrieval prompts that produce consistent, linkable records for a memory system.

2. Required fields list (mandatory)
   Required columns for each YouTube video record

1) video_id

* Type: string
* Max size: 32
* Purpose: Canonical internal ID for this record (UUID or ULID).
* Normalize or index: PRIMARY KEY.

2. platform

* Type: string (enum)
* Max size: 16
* Purpose: Source platform identifier, set to "youtube".
* Normalize or index: CHECK constraint or enum.

3. youtube_video_id

* Type: string
* Max size: 16
* Purpose: YouTube video identifier (the v= parameter).
* Normalize or index: UNIQUE index (platform, youtube_video_id).

4. canonical_url

* Type: string
* Max size: 2048
* Purpose: Canonical watch URL in a consistent format.
* Normalize or index: UNIQUE index on canonical_url. Also store a hash if your DB indexes long strings poorly.

5. title

* Type: string
* Max size: 512
* Purpose: Video title for display and search.
* Normalize or index: Full-text index (optional) if searching titles.

6. creator_id

* Type: string
* Max size: 32
* Purpose: Foreign key to Creator table (channel or owner).
* Normalize or index: FOREIGN KEY. Index on creator_id for filtering.

7. creator_display_name

* Type: string
* Max size: 256
* Purpose: Snapshot of creator name at ingestion time for display.
* Normalize or index: Not unique. Do not use as FK.

8. published_at

* Type: datetime
* Expected size: ISO 8601 timestamp
* Purpose: Upload publish time for sorting and filtering.
* Normalize or index: Index on published_at (descending).

9. duration_seconds

* Type: integer
* Expected size: 32-bit
* Purpose: Duration in seconds for UI and timestamp validation.
* Normalize or index: None. Add CHECK duration_seconds >= 0.

10. transcript_status

* Type: string (enum)
* Max size: 32
* Purpose: State of transcript availability: "none", "partial", "full", "failed".
* Normalize or index: CHECK constraint.

11. transcript_source

* Type: string (enum)
* Max size: 32
* Purpose: Where transcript came from: "captions", "auto", "asr", "manual", "unknown".
* Normalize or index: CHECK constraint.

12. transcript_text

* Type: text
* Expected size: up to megabytes
* Purpose: Full transcript text for search, embedding, and summarization.
* Normalize or index: Store out-of-row if supported. Full-text index or external search index.

13. summary

* Type: text
* Expected size: 2k to 8k chars
* Purpose: Human-readable summary for fast browsing and retrieval.
* Normalize or index: Full-text index optional.

14. language_code

* Type: string
* Max size: 12
* Purpose: BCP-47 language tag (example: "en", "en-US").
* Normalize or index: Index if filtering by language.

15. ingestion_status

* Type: string (enum)
* Max size: 32
* Purpose: Pipeline status: "queued", "ingested", "retry", "failed", "blocked".
* Normalize or index: Index for job management.

16. ingested_at

* Type: datetime
* Expected size: ISO 8601 timestamp
* Purpose: When your system ingested the record.
* Normalize or index: Index on ingested_at.

17. updated_at

* Type: datetime
* Expected size: ISO 8601 timestamp
* Purpose: Last time this record changed.
* Normalize or index: Index on updated_at.

3. Recommended optional fields
   Add these when you need richer filtering, UI, or compliance controls.

1) description

* Type: text
* Expected size: up to 20k chars (or more)
* Purpose: Video description for search and context.
* Normalize or index: Full-text index optional.

2. thumbnail_url

* Type: string
* Max size: 2048
* Purpose: Primary thumbnail for UI.
* Normalize or index: None.

3. channel_id

* Type: string
* Max size: 64
* Purpose: YouTube channel ID if you store both creator_id and YouTube channel id.
* Normalize or index: Index if frequently queried.

4. view_count

* Type: bigint
* Expected size: 64-bit
* Purpose: Snapshot metric for ranking.
* Normalize or index: None. Store captured_at if you refresh.

5. like_count

* Type: bigint
* Expected size: 64-bit
* Purpose: Snapshot metric for ranking.
* Normalize or index: None.

6. category_id

* Type: string or integer
* Max size: 32
* Purpose: YouTube category classification.
* Normalize or index: FK to Categories table, index on category_id.

7. license

* Type: string
* Max size: 64
* Purpose: License label for compliance.
* Normalize or index: None. Or enum.

8. content_rating

* Type: string
* Max size: 32
* Purpose: Flags like "madeForKids" or age-restriction if needed.
* Normalize or index: Index for filtering.

9. tags

* Type: array of strings or join table
* Expected size: 0 to 50 tags
* Purpose: Keyword tagging for browsing and search.
* Normalize or index: Prefer join table (video_tags) with index on tag.

10. topics

* Type: array of strings
* Expected size: 0 to 20
* Purpose: LLM-derived topics for retrieval.
* Normalize or index: Store as jsonb, or join table if you query heavily.

11. transcript_segments

* Type: json array
* Expected size: depends on chunking
* Purpose: Timestamped segments (start/end + text) for citations and chunk embeddings.
* Normalize or index: Store as jsonb. Create GIN index if you query inside JSON.

12. chapters

* Type: json array
* Expected size: 0 to 50
* Purpose: Short timestamps with labels for UI navigation.
* Normalize or index: jsonb.

13. external_links

* Type: json array
* Expected size: 0 to 50
* Purpose: Links found in description or transcript.
* Normalize or index: jsonb.

14. content_hash

* Type: string
* Max size: 64
* Purpose: Dedup detection over transcript_text + title + creator.
* Normalize or index: UNIQUE index if you enforce no duplicates.

15. transcript_version

* Type: integer
* Expected size: 32-bit
* Purpose: Track transcript refreshes and re-embeddings.
* Normalize or index: None.

16. rights_policy

* Type: string (enum)
* Max size: 32
* Purpose: Retention and usage policy: "store_full", "store_chunks_only", "store_summary_only".
* Normalize or index: CHECK constraint. Index if governance workflows depend on it.

4. Storage and retrieval considerations
   Large text and transcripts

* Store transcript_text in a text column, but treat it as a blob.
* If your DB supports it, keep large text out-of-row and compress it.
* Keep transcript_segments as chunked text with start_seconds and end_seconds. Use this for citations and embedding.

Full-text search

* Put title, description, summary, and transcript_text into a full-text index if you need keyword search.
* If you expect scale, push searchable fields into a dedicated search engine (OpenSearch, Elasticsearch, Meilisearch).

Embeddings and vector store linking

* Create transcript chunks: 500 to 1,200 tokens per chunk, 50 to 150 token overlap.
* Compute embeddings per chunk, store them in a vector table keyed by video_id + chunk_id.
* Keep a separate embedding for metadata (title + summary + tags) for better recall.
* Link vectors back to transcript_segments using chunk_id.

Caching strategies

* Cache read-heavy fields: title, thumbnail_url, creator_display_name, duration_seconds, published_at, summary.
* Cache top retrieval results per query hash for short TTL if you have repeated queries.
* Cache transcript fetch results and rate limit states to reduce API hits.

External links and URLs

* Always store canonical_url and also store original_url_input (optional) for auditing.
* Normalize URLs to one format and strip tracking parameters.

5. Schema examples
   5a) SQL-like CREATE TABLE style

CREATE TABLE youtube_videos (
video_id              VARCHAR(32) PRIMARY KEY,
platform              VARCHAR(16) NOT NULL CHECK (platform IN ('youtube')),
youtube_video_id      VARCHAR(16) NOT NULL,
canonical_url         VARCHAR(2048) NOT NULL,
title                 VARCHAR(512) NOT NULL,

creator_id            VARCHAR(32) NOT NULL,
creator_display_name  VARCHAR(256) NOT NULL,

published_at          TIMESTAMPTZ NOT NULL,
duration_seconds      INT NOT NULL CHECK (duration_seconds >= 0),

transcript_status     VARCHAR(32) NOT NULL CHECK (transcript_status IN ('none','partial','full','failed')),
transcript_source     VARCHAR(32) NOT NULL CHECK (transcript_source IN ('captions','auto','asr','manual','unknown')),
transcript_text       TEXT NOT NULL,
summary               TEXT NOT NULL,
language_code         VARCHAR(12) NOT NULL,

ingestion_status      VARCHAR(32) NOT NULL CHECK (ingestion_status IN ('queued','ingested','retry','failed','blocked')),
ingested_at           TIMESTAMPTZ NOT NULL,
updated_at            TIMESTAMPTZ NOT NULL,

CONSTRAINT uq_youtube_platform_video UNIQUE (platform, youtube_video_id),
CONSTRAINT uq_youtube_canonical_url UNIQUE (canonical_url),
CONSTRAINT fk_youtube_creator FOREIGN KEY (creator_id) REFERENCES creators(creator_id)
);

CREATE INDEX ix_youtube_videos_creator_id ON youtube_videos(creator_id);
CREATE INDEX ix_youtube_videos_published_at ON youtube_videos(published_at DESC);
CREATE INDEX ix_youtube_videos_ingested_at ON youtube_videos(ingested_at DESC);
CREATE INDEX ix_youtube_videos_updated_at ON youtube_videos(updated_at DESC);
CREATE INDEX ix_youtube_videos_language_code ON youtube_videos(language_code);

Optional full-text index example (Postgres)
-- CREATE INDEX ftx_youtube_videos_text ON youtube_videos USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(transcript_text,'')));

5b) JSON Schema example for document stores

{
"$schema": "[https://json-schema.org/draft/2020-12/schema](https://json-schema.org/draft/2020-12/schema)",
"$id": "[https://schemas.example/youtube-video.schema.json](https://schemas.example/youtube-video.schema.json)",
"title": "YouTubeVideo",
"type": "object",
"additionalProperties": false,
"required": [
"video_id",
"platform",
"youtube_video_id",
"canonical_url",
"title",
"creator",
"published_at",
"duration_seconds",
"transcript",
"summary",
"language_code",
"ingestion",
"timestamps"
],
"properties": {
"video_id": { "type": "string", "maxLength": 32 },
"platform": { "type": "string", "enum": ["youtube"], "maxLength": 16 },
"youtube_video_id": { "type": "string", "maxLength": 16 },
"canonical_url": { "type": "string", "maxLength": 2048 },

```
"title": { "type": "string", "maxLength": 512 },

"creator": {
  "type": "object",
  "additionalProperties": false,
  "required": ["creator_id", "display_name"],
  "properties": {
    "creator_id": { "type": "string", "maxLength": 32 },
    "display_name": { "type": "string", "maxLength": 256 },
    "channel_id": { "type": "string", "maxLength": 64 }
  }
},

"published_at": { "type": "string", "format": "date-time" },
"duration_seconds": { "type": "integer", "minimum": 0 },

"transcript": {
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "source", "text"],
  "properties": {
    "status": { "type": "string", "enum": ["none", "partial", "full", "failed"] },
    "source": { "type": "string", "enum": ["captions", "auto", "asr", "manual", "unknown"] },
    "text": { "type": "string" },
    "segments": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["chunk_id", "start_seconds", "end_seconds", "text"],
        "properties": {
          "chunk_id": { "type": "string", "maxLength": 64 },
          "start_seconds": { "type": "integer", "minimum": 0 },
          "end_seconds": { "type": "integer", "minimum": 0 },
          "text": { "type": "string" }
        }
      }
    }
  }
},

"summary": { "type": "string", "maxLength": 12000 },
"language_code": { "type": "string", "maxLength": 12 },

"timestamps": {
  "type": "object",
  "additionalProperties": false,
  "required": ["ingested_at", "updated_at"],
  "properties": {
    "ingested_at": { "type": "string", "format": "date-time" },
    "updated_at": { "type": "string", "format": "date-time" }
  }
},

"ingestion": {
  "type": "object",
  "additionalProperties": false,
  "required": ["status"],
  "properties": {
    "status": { "type": "string", "enum": ["queued", "ingested", "retry", "failed", "blocked"] },
    "attempt_count": { "type": "integer", "minimum": 0 },
    "last_error": { "type": "string", "maxLength": 2000 }
  }
},

"chapters": {
  "type": "array",
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": ["start_seconds", "label", "description"],
    "properties": {
      "start_seconds": { "type": "integer", "minimum": 0 },
      "label": { "type": "string", "maxLength": 120 },
      "description": { "type": "string", "maxLength": 500 }
    }
  }
}
```

}
}

6. Prompt templates for ingestion and memory linking
   6a) Ingestion prompt

SYSTEM
You are a YouTube ingestion agent. Your job: fetch metadata and transcript for a YouTube URL, create a structured record that matches the provided JSON Schema exactly. Output JSON only.

USER
INPUT
{
"youtube_url": "[https://youtube.example/watch?v=VIDEO_ID](https://youtube.example/watch?v=VIDEO_ID)",
"requested_transcript_language_preference": ["en", "en-US"],
"max_transcript_chars": 250000,
"chunking": {
"enabled": true,
"max_chunk_tokens": 900,
"overlap_tokens": 120
},
"timestamps_to_generate": 3,
"schema": "PASTE_JSON_SCHEMA_HERE",
"rate_limit_policy": {
"max_retries": 3,
"retry_backoff_seconds": [2, 10, 30]
}
}

TASKS

1. Normalize the URL into canonical_url and extract youtube_video_id.
2. Fetch video metadata: title, creator/channel display name, published_at, duration_seconds, and channel_id if available.
3. Fetch transcript. Prefer human captions, then auto captions. Record transcript_source. If no transcript available, set transcript.status to "none" and transcript.text to "".
4. Detect language_code from transcript text, fallback to metadata if transcript missing.
5. If transcript text exceeds max_transcript_chars, truncate safely at a sentence boundary and set transcript.status to "partial". Otherwise "full". Keep transcript.text within the limit.
6. If chunking.enabled is true and transcript.text is non-empty, create transcript.segments with chunk_id, start_seconds, end_seconds, and text.

* Use start_seconds and end_seconds from caption timing when possible.
* If you lack timing, set approximate ranges by evenly splitting duration_seconds.

7. Create summary (target 6 to 10 sentences, no bullet points).
8. Create 2 to 3 chapters: start_seconds + label + description. Use meaningful moments.
9. Populate ingestion.status and timestamps.ingested_at, timestamps.updated_at in ISO 8601.
10. Handle failures:

* If a fetch fails due to rate limits or network errors, set ingestion.status to "retry" after first failures, and to "failed" after max_retries.
* Put the error message into ingestion.last_error.
* Still output a valid JSON document matching schema, even on failure.

OUTPUT RULES

* Output JSON only. No markdown. No commentary.
* All required schema fields must exist.
* Dates: ISO 8601 with timezone, example "2025-12-28T22:15:00Z".
* Video timestamps: integer seconds.
* Keep summary max 12000 chars.
* Keep ingestion.last_error max 2000 chars.
* transcript.text max max_transcript_chars.

6b) Memory-linking prompt

SYSTEM
You are a retrieval and linking agent for a memory system. You receive a user query plus a candidate set of video chunk embeddings and metadata. You must return the top matches, then produce a short answer with citations to video timestamps. Output JSON only.

USER
INPUT
{
"query": "USER_QUERY_TEXT",
"top_n": 5,
"min_similarity": 0.25,
"query_embedding": [0.01, 0.02, 0.03],
"candidates": [
{
"video_id": "VIDEO_RECORD_ID",
"canonical_url": "[https://youtube.example/watch?v=VIDEO_ID](https://youtube.example/watch?v=VIDEO_ID)",
"title": "TITLE",
"creator_display_name": "CREATOR",
"published_at": "2025-12-01T12:00:00Z",
"language_code": "en",
"chunks": [
{
"chunk_id": "VIDEO_RECORD_ID:0001",
"start_seconds": 120,
"end_seconds": 240,
"embedding": [0.01, 0.02, 0.03],
"text_preview": "SHORT_SNIPPET"
}
]
}
]
}

TASKS

1. Compute semantic similarity between query_embedding and each candidate chunk embedding using cosine similarity.
2. For each video, keep the best-matching chunk score and also the top 2 chunks.
3. Filter out matches below min_similarity.
4. Sort by similarity desc, return top_n results.
5. Create linking suggestions:

* Include video_id, canonical_url, title, creator_display_name
* Include best_chunk and up to 2 supporting_chunks with timestamps
* Include similarity_score for each returned video

6. Produce a short synthesized answer (4 to 8 sentences) that directly responds to the query.
7. Add citations in the answer by referencing matched videos and timestamps:

* Cite format: (video_id at mm:ss)
* Use mm:ss derived from start_seconds rounded down.

OUTPUT FORMAT
{
"query": "string",
"results": [
{
"video_id": "string",
"canonical_url": "string",
"title": "string",
"creator_display_name": "string",
"published_at": "date-time",
"language_code": "string",
"similarity_score": 0.0,
"best_chunk": {
"chunk_id": "string",
"start_seconds": 0,
"end_seconds": 0,
"start_mmss": "mm:ss",
"end_mmss": "mm:ss",
"text_preview": "string"
},
"supporting_chunks": [
{
"chunk_id": "string",
"start_seconds": 0,
"end_seconds": 0,
"start_mmss": "mm:ss",
"end_mmss": "mm:ss",
"text_preview": "string"
}
]
}
],
"synthesized_answer": "string",
"link_actions": [
{
"action": "link_video_to_memory",
"video_id": "string",
"reason": "string",
"confidence": 0.0
}
]
}

OUTPUT RULES

* Output JSON only.
* similarity_score range 0.0 to 1.0.
* Include empty arrays if no matches pass min_similarity.
* Keep synthesized_answer max 1500 chars.
* Never include private data. Use only provided fields.

7. Output format constraints
   Ingestion output constraints

* JSON keys must match the JSON Schema in section 5b.
* Required nested objects: creator, transcript, ingestion, timestamps.
* Date fields: ISO 8601 date-time with timezone.
* Video timestamps: integer seconds.
* Transcript truncation: keep transcript.text length <= max_transcript_chars.
* Token cap guidance: if the model risks exceeding limits, prefer dropping transcript.segments text length (shorten segment text) while keeping transcript.text and schema validity.

Memory-linking output constraints

* JSON structure exactly as defined in section 6b output format.
* mm:ss format: zero-padded minutes and seconds, example 03:07.
* Keep results length <= top_n.
* Keep similarity_score numeric with 3 decimals max.

Ingestion example output (placeholder, small)

{
"video_id": "01JQZ9X3Q8ZQW0Q9Z0Z0Z0Z0Z0",
"platform": "youtube",
"youtube_video_id": "VIDEO_ID",
"canonical_url": "[https://youtube.example/watch?v=VIDEO_ID](https://youtube.example/watch?v=VIDEO_ID)",
"title": "Example Video Title",
"creator": {
"creator_id": "01JQZ9X3Q8CREATOR0000000000",
"display_name": "Example Creator",
"channel_id": "CHANNEL_ID"
},
"published_at": "2025-12-01T12:00:00Z",
"duration_seconds": 623,
"transcript": {
"status": "partial",
"source": "auto",
"text": "This is a short placeholder transcript excerpt. It represents the content captured from captions. The full transcript was truncated due to limits.",
"segments": [
{
"chunk_id": "01JQZ9X3Q8ZQW0Q9Z0Z0Z0Z0Z0:0001",
"start_seconds": 0,
"end_seconds": 210,
"text": "Intro and context excerpt."
},
{
"chunk_id": "01JQZ9X3Q8ZQW0Q9Z0Z0Z0Z0Z0:0002",
"start_seconds": 210,
"end_seconds": 420,
"text": "Main concept excerpt."
}
]
},
"summary": "This video explains an example topic and walks through key points in order. It highlights a problem statement, then outlines an approach. It includes a quick example and a short recap at the end.",
"language_code": "en",
"timestamps": {
"ingested_at": "2025-12-28T22:15:00Z",
"updated_at": "2025-12-28T22:15:00Z"
},
"ingestion": {
"status": "ingested",
"attempt_count": 1,
"last_error": ""
},
"chapters": [
{ "start_seconds": 15, "label": "Problem", "description": "Defines the problem and why it matters." },
{ "start_seconds": 185, "label": "Approach", "description": "Explains the approach and the main steps." },
{ "start_seconds": 520, "label": "Wrap-up", "description": "Summarizes takeaways and next actions." }
]
}

Memory-linking example output (placeholder, small)

{
"query": "How does the video explain the main steps?",
"results": [
{
"video_id": "01JQZ9X3Q8ZQW0Q9Z0Z0Z0Z0Z0",
"canonical_url": "[https://youtube.example/watch?v=VIDEO_ID](https://youtube.example/watch?v=VIDEO_ID)",
"title": "Example Video Title",
"creator_display_name": "Example Creator",
"published_at": "2025-12-01T12:00:00Z",
"language_code": "en",
"similarity_score": 0.812,
"best_chunk": {
"chunk_id": "01JQZ9X3Q8ZQW0Q9Z0Z0Z0Z0Z0:0002",
"start_seconds": 210,
"end_seconds": 420,
"start_mmss": "03:30",
"end_mmss": "07:00",
"text_preview": "Main concept excerpt."
},
"supporting_chunks": [
{
"chunk_id": "01JQZ9X3Q8ZQW0Q9Z0Z0Z0Z0Z0:0001",
"start_seconds": 0,
"end_seconds": 210,
"start_mmss": "00:00",
"end_mmss": "03:30",
"text_preview": "Intro and context excerpt."
}
]
}
],
"synthesized_answer": "The video lays out the steps by first framing the problem, then moving into the approach section where it lists the sequence to follow (01JQZ9X3Q8ZQW0Q9Z0Z0Z0Z0Z0 at 03:30). It also sets context earlier to explain why the steps are ordered that way (01JQZ9X3Q8ZQW0Q9Z0Z0Z0Z0Z0 at 00:00).",
"link_actions": [
{
"action": "link_video_to_memory",
"video_id": "01JQZ9X3Q8ZQW0Q9Z0Z0Z0Z0Z0",
"reason": "Best semantic match to the query with strong supporting chunk coverage.",
"confidence": 0.85
}
]
}

8. Indexing, privacy and compliance notes
   Checklist

* Copyright: Store transcripts only if your use complies with applicable terms and your policy. Support a mode that stores summary and timestamps only.
* GDPR and creator data: Treat creator/channel info as personal data when it identifies a person. Store minimal fields, document lawful basis, provide deletion on request.
* Opt-out: Maintain a denylist keyed by youtube_video_id and channel_id. Block ingestion and remove existing content.
* Retention: Set retention by rights_policy. Example: keep full transcript 90 days, keep summary and embeddings 1 year, configurable per tenant.
* Audit: Store ingestion.attempt_count and last_error. Log access to transcripts if required.

9. Best-practice guidelines

* Canonicalize URLs to one format and store youtube_video_id separately.
* Enforce uniqueness on (platform, youtube_video_id) and canonical_url.
* Normalize creators into a creators table, keep creator_display_name as a snapshot.
* Always store duration_seconds and validate chapter timestamps within duration.
* Detect transcript language and store BCP-47 tags, not free text.
* Chunk transcripts consistently and keep stable chunk_id values for re-embedding.
* Track transcript_version and re-embed only when transcript changes.
* Use content_hash to detect duplicates across URL variants and reuploads.
* Store both full-text search fields and embeddings, do not rely on one method.
* Fail soft: output a valid record with ingestion.status and last_error even when transcript fetch fails.
