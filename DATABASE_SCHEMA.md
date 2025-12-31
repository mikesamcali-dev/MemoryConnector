# Memory Connector Database Schema

Complete reference for all database tables and their fields.

---

## Table of Contents
- [User & Authentication](#user--authentication)
- [Memory System](#memory-system)
- [Structured Memory Types](#structured-memory-types)
- [Shared/Reusable Entities](#sharedreusable-entities)
- [Media & Content](#media--content)
- [Linking Tables](#linking-tables)
- [Supporting Tables](#supporting-tables)
- [System Tables](#system-tables)

---

## User & Authentication

### users
User accounts and authentication.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email address |
| password_hash | String | Hashed password |
| tier | String | Subscription tier (free/premium) |
| roles | String[] | User roles (default: ["user"]) |
| created_at | DateTime | Account creation timestamp |
| updated_at | DateTime | Last update timestamp |

### sessions
JWT refresh token sessions.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| refresh_token_hash | String | Hashed refresh token |
| expires_at | DateTime | Session expiration |
| created_at | DateTime | Session creation timestamp |

### user_usage
Usage tracking per user.

| Field | Type | Description |
|-------|------|-------------|
| user_id | UUID | Primary key, foreign key to users |
| memories_today | Int | Daily memory count |
| memories_this_month | Int | Monthly memory count |
| images_this_month | Int | Monthly image count |
| voice_this_month | Int | Monthly voice usage |
| searches_today | Int | Daily search count |
| storage_bytes | BigInt | Total storage used |
| last_daily_reset | DateTime | Last daily counter reset |
| last_monthly_reset | DateTime | Last monthly counter reset |

### user_reminder_preferences
User-specific reminder settings.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users (unique) |
| first_reminder_minutes | Int | First reminder delay (default: 3) |
| second_reminder_minutes | Int | Second reminder delay (default: 4320 = 3 days) |
| third_reminder_minutes | Int | Third reminder delay (default: 30240 = 3 weeks) |
| reminders_enabled | Boolean | Enable/disable reminders (default: true) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### tier_limits
Tier-based usage limits.

| Field | Type | Description |
|-------|------|-------------|
| tier | String | Primary key (free/premium) |
| memories_per_day | Int | Daily memory limit |
| memories_per_month | Int | Monthly memory limit |
| images_per_month | Int | Monthly image limit |
| voice_per_month | Int | Monthly voice limit |
| searches_per_day | Int | Daily search limit |
| storage_bytes | BigInt | Storage limit |
| api_rate_per_min | Int | API rate limit per minute |

---

## Memory System

### memories
Core memory entity.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| title | String(500) | Memory title (optional) |
| body | Text | Memory content (optional) |
| occurred_at | DateTime | When memory happened (optional) |
| start_at | DateTime | Event start time (optional) |
| end_at | DateTime | Event end time (optional) |
| data | JSON | Generic metadata for non-structured types |
| latitude | Float | Location latitude (optional) |
| longitude | Float | Location longitude (optional) |
| image_url | String | Associated image URL (optional) |
| state | Enum | Memory state (SAVED/DRAFT/DELETED) |
| content_hash | String(32) | SHA-256 hash for deduplication |
| enrichment_status | Enum | AI enrichment status |
| enrichment_queued_at | DateTime | When enrichment was queued |
| location_id | UUID | Foreign key to locations (optional) |
| person_id | UUID | Foreign key to people (optional) |
| youtube_video_id | UUID | Foreign key to youtube_videos (optional) |
| tiktok_video_id | UUID | Foreign key to tiktok_videos (optional) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### memory_types
Admin-controlled memory type registry.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| code | String | Unique type code (e.g., "event", "note") |
| label | String | Human-readable name |
| description | String | Type description (optional) |
| icon | String | Emoji icon (default: "📝") |
| color | String | Hex color (default: "#6B7280") |
| storage_strategy | Enum | generic/structured |
| table_name | String | Database table name for structured types |
| enabled | Boolean | Type is active (default: true) |
| sort_order | Int | Display order (default: 0) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### memory_type_assignments
Many-to-many memory type assignments.

| Field | Type | Description |
|-------|------|-------------|
| memory_id | UUID | Foreign key to memories |
| memory_type_id | UUID | Foreign key to memory_types |
| confidence | Float | AI confidence score (default: 1.0) |
| created_at | DateTime | Assignment timestamp |
| updated_at | DateTime | Last update timestamp |

---

## Structured Memory Types

### events
Structured event data.

| Field | Type | Description |
|-------|------|-------------|
| memory_id | UUID | Primary key, foreign key to memories |
| start_at | DateTime | Event start time (optional) |
| end_at | DateTime | Event end time (optional) |
| timezone | String(50) | Timezone (optional) |
| recurrence_rule | Text | Recurrence pattern (optional) |
| description | Text | Event description (optional) |
| tags | String[] | Event tags |
| last_enriched_at | DateTime | Last AI enrichment timestamp |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

## Shared/Reusable Entities

### locations
Reusable location entities.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String(200) | Location name |
| address | Text | Full address (optional) |
| city | String(100) | City (optional) |
| state | String(100) | State/province (optional) |
| zip | String(20) | Postal code (optional) |
| country | String(100) | Country (optional) |
| latitude | Float | Latitude (optional) |
| longitude | Float | Longitude (optional) |
| location_type | String(50) | Type of location (optional) |
| place_type | String(50) | Place category (optional) |
| last_enriched_at | DateTime | Last AI enrichment timestamp |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### people
Reusable person entities.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| display_name | String(200) | Person's name |
| email | String(255) | Email address (optional) |
| phone | String(50) | Phone number (optional) |
| bio | Text | Biography (optional) |
| last_enriched_at | DateTime | Last AI enrichment timestamp |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### person_relationships
Relationships between people.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| source_person_id | UUID | Foreign key to people |
| target_person_id | UUID | Foreign key to people |
| relationship_type | String(100) | Type of relationship |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### words
Reusable word/vocabulary entities.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| word | String(100) | The word (unique) |
| description | Text | Definition (optional) |
| phonetic | String(100) | Phonetic spelling (optional) |
| part_of_speech | String(50) | Part of speech (optional) |
| etymology | Text | Word origin (optional) |
| examples | JSON | Example sentences array (optional) |
| synonyms | JSON | Synonyms array (optional) |
| antonyms | JSON | Antonyms array (optional) |
| difficulty | String(20) | Difficulty level (optional) |
| last_enriched_at | DateTime | Last AI enrichment timestamp |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### excluded_words
User-specific spell-check exclusions.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| word | String(100) | Word to exclude |
| created_at | DateTime | Creation timestamp |

---

## Media & Content

### images
Image storage with metadata.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| storage_url | Text | Image storage URL |
| storage_key | Text | Storage identifier |
| thumbnail_url_256 | Text | 256px thumbnail URL (optional) |
| thumbnail_url_1024 | Text | 1024px thumbnail URL (optional) |
| content_type | String(50) | MIME type |
| size_bytes | Int | File size in bytes |
| sha256 | String(64) | SHA-256 hash for deduplication |
| phash | String(64) | Perceptual hash (optional) |
| width | Int | Image width in pixels (optional) |
| height | Int | Image height in pixels (optional) |
| exif_data | JSON | EXIF metadata (optional) |
| captured_at | DateTime | When photo was taken (optional) |
| latitude | Float | GPS latitude (optional) |
| longitude | Float | GPS longitude (optional) |
| location_accuracy | Float | GPS accuracy (optional) |
| location_source | String(20) | GPS source (optional) |
| consent_biometrics | Boolean | Face detection consent (default: false) |
| created_at | DateTime | Upload timestamp |
| updated_at | DateTime | Last update timestamp |

### image_faces
Detected faces in images.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| image_id | UUID | Foreign key to images |
| bbox_x | Int | Bounding box X coordinate |
| bbox_y | Int | Bounding box Y coordinate |
| bbox_width | Int | Bounding box width |
| bbox_height | Int | Bounding box height |
| blur_score | Float | Face blur score (optional) |
| occlusion_score | Float | Face occlusion score (optional) |
| pose_yaw | Float | Face yaw angle (optional) |
| pose_pitch | Float | Face pitch angle (optional) |
| pose_roll | Float | Face roll angle (optional) |
| embedding | JSON | Face embedding vector (optional, requires consent) |
| embedding_model | String(50) | Embedding model used (optional) |
| face_crop_url | Text | Cropped face image URL (optional) |
| created_at | DateTime | Detection timestamp |

### image_person_links
Links detected faces to people.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| image_id | UUID | Foreign key to images |
| person_id | UUID | Foreign key to people |
| face_id | UUID | Foreign key to image_faces (optional) |
| confidence | Float | Match confidence score (optional) |
| link_method | String(20) | auto/confirmed/manual |
| created_at | DateTime | Link creation timestamp |

### url_pages
Saved web pages with AI-extracted metadata.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| url | Text | Original URL |
| url_hash | String(64) | SHA-256 hash for deduplication |
| title | Text | Page title (optional) |
| description | Text | Meta description (optional) |
| summary | Text | AI-generated summary (optional) |
| content | Text | Extracted page content (optional) |
| author | String(255) | Content author (optional) |
| published_at | DateTime | Publication date (optional) |
| site_name | String(255) | Website name (optional) |
| image_url | Text | Open Graph image (optional) |
| tags | JSON | AI-extracted tags array (optional) |
| metadata | JSON | Additional AI metadata (optional) |
| fetched_at | DateTime | When page was fetched |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### youtube_videos
YouTube video metadata and transcripts.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| platform | String(16) | Platform identifier (default: "youtube") |
| youtube_video_id | String(16) | YouTube video ID |
| canonical_url | String(2048) | Canonical video URL |
| title | String(512) | Video title |
| description | Text | Video description (optional) |
| thumbnail_url | String(2048) | Thumbnail URL (optional) |
| creator_display_name | String(256) | Channel name |
| channel_id | String(64) | YouTube channel ID (optional) |
| published_at | DateTime | Publication date |
| duration_seconds | Int | Video duration |
| language_code | String(12) | Language code |
| license | String(64) | License type (optional) |
| made_for_kids | Boolean | Made for kids flag (optional) |
| caption_available | Boolean | Captions available flag (optional) |
| transcript_status | Enum | Transcript status (none/partial/full/failed) |
| transcript_source | Enum | Transcript source (captions/auto/asr/manual/unknown) |
| transcript_text | Text | Full transcript text (optional) |
| transcript_segments | JSON | Timestamped segments array (optional) |
| summary | Text | AI-generated summary (optional) |
| topics | JSON | AI-extracted topics array (optional) |
| chapters | JSON | Video chapters array (optional) |
| view_count | BigInt | View count snapshot (optional) |
| like_count | BigInt | Like count snapshot (optional) |
| favorite_count | BigInt | Favorite count snapshot (optional) |
| comment_count | BigInt | Comment count snapshot (optional) |
| category_id | String(32) | YouTube category ID (optional) |
| captured_at | DateTime | When metrics were captured (optional) |
| tags | JSON | Video tags array (optional) |
| external_links | JSON | Links from description (optional) |
| content_hash | String(64) | Content hash (optional) |
| ingestion_status | Enum | Ingestion status |
| ingestion_attempts | Int | Number of ingestion attempts |
| last_ingestion_error | Text | Last error message (optional) |
| ingested_at | DateTime | When ingested (optional) |
| last_enriched_at | DateTime | Last AI enrichment timestamp (optional) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### tiktok_videos
TikTok video metadata and transcripts.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| platform | String(16) | Platform identifier (default: "tiktok") |
| tiktok_video_id | String(64) | TikTok video ID |
| canonical_url | String(2048) | Canonical video URL |
| title | String(512) | Video title |
| description | Text | Video description (optional) |
| thumbnail_url | String(2048) | Thumbnail URL (optional) |
| creator_display_name | String(256) | Creator name |
| creator_username | String(128) | Creator username (optional) |
| creator_id | String(64) | Creator ID (optional) |
| published_at | DateTime | Publication date (optional) |
| duration_seconds | Int | Video duration (optional) |
| summary | Text | AI-generated summary (optional) |
| transcript | Text | Whisper transcription (optional) |
| extracted_data | JSON | Structured Whisper analysis (optional) |
| topics | JSON | AI-extracted topics array (optional) |
| music_info | JSON | Music metadata (optional) |
| view_count | BigInt | View count snapshot (optional) |
| like_count | BigInt | Like count snapshot (optional) |
| share_count | BigInt | Share count snapshot (optional) |
| comment_count | BigInt | Comment count snapshot (optional) |
| captured_at | DateTime | When metrics were captured (optional) |
| hashtags | JSON | Hashtags array (optional) |
| mentions | JSON | Mentioned users array (optional) |
| external_links | JSON | Links from description (optional) |
| content_hash | String(64) | Content hash (optional) |
| ingestion_status | Enum | Ingestion status |
| ingestion_attempts | Int | Number of ingestion attempts |
| last_ingestion_error | Text | Last error message (optional) |
| ingested_at | DateTime | When ingested (optional) |
| last_enriched_at | DateTime | Last AI enrichment timestamp (optional) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

## Linking Tables

### memory_links
Generic memory-to-memory relationships.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| source_id | UUID | Source memory foreign key |
| target_id | UUID | Target memory foreign key |
| link_type | Enum | locatedAt/summaryOf/hasMedia/related/mentions |
| metadata | JSON | Additional link metadata (optional) |
| created_at | DateTime | Link creation timestamp |
| updated_at | DateTime | Last update timestamp |

### memory_word_links
Links memories to words.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| memory_id | UUID | Foreign key to memories |
| word_id | UUID | Foreign key to words |
| created_at | DateTime | Link creation timestamp |

### memory_image_links
Links memories to images.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| memory_id | UUID | Foreign key to memories |
| image_id | UUID | Foreign key to images |
| created_at | DateTime | Link creation timestamp |

### memory_url_page_links
Links memories to URL pages.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| memory_id | UUID | Foreign key to memories |
| url_page_id | UUID | Foreign key to url_pages |
| created_at | DateTime | Link creation timestamp |

---

## Supporting Tables

### embeddings
Vector embeddings for semantic search.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| memory_id | UUID | Foreign key to memories |
| user_id | UUID | Foreign key to users |
| model_version | String | Embedding model (default: "text-embedding-ada-002") |
| created_at | DateTime | Creation timestamp |

**Note:** The actual vector data is stored in partitioned tables `embeddings_partition_0` through `embeddings_partition_15` with HNSW indexes for efficient similarity search.

### reminders
Memory reminder notifications.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| memory_id | UUID | Foreign key to memories |
| scheduled_at | DateTime | When reminder should be sent |
| sent_at | DateTime | When reminder was sent (optional) |
| status | Enum | pending/sent/cancelled |
| read_at | DateTime | When user read the reminder (optional) |
| dismissed_at | DateTime | When user dismissed the reminder (optional) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### idempotency_keys
Request deduplication tracking.

| Field | Type | Description |
|-------|------|-------------|
| idempotency_key | String(100) | Primary key |
| user_id | UUID | Foreign key to users |
| endpoint | String(100) | API endpoint |
| request_hash | String(64) | Request body hash (optional) |
| response_status | Int | HTTP response status (optional) |
| response_body | JSON | Cached response (optional) |
| created_at | DateTime | Creation timestamp |
| expires_at | DateTime | Expiration timestamp |
| memory_id | UUID | Related memory foreign key (optional) |

### ai_cost_tracking
AI API usage and cost tracking.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key (auto-increment) |
| date | Date | Usage date |
| user_id | UUID | Foreign key to users |
| operation | String(50) | Operation type |
| tokens_used | Int | Token count |
| cost_cents | Decimal(10,4) | Cost in cents |
| model | String(100) | AI model used |
| memory_id | UUID | Related memory foreign key (optional) |
| created_at | DateTime | Creation timestamp |

---

## System Tables

### audit_trail
Comprehensive audit logging.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Multi-tenancy identifier (optional) |
| user_id | UUID | Acting user (optional) |
| actor_type | String(20) | Actor type (default: "USER") |
| actor_email | String(255) | Actor email (optional) |
| impersonator_id | UUID | Impersonating user (optional) |
| event_type | String(50) | Event classification |
| action | String(20) | Action performed |
| entity_name | String(100) | Affected entity type (optional) |
| entity_id | UUID | Affected entity ID (optional) |
| created_at | DateTime | Event timestamp |
| duration_ms | Int | Operation duration (optional) |
| ip_address | String(45) | Client IP (optional) |
| user_agent | Text | User agent string (optional) |
| device_id | String(100) | Device identifier (optional) |
| geo_country | String(2) | Country code (optional) |
| geo_city | String(100) | City (optional) |
| request_id | String(100) | Request ID (optional) |
| session_id | String(100) | Session ID (optional) |
| correlation_id | String(100) | Correlation ID (optional) |
| trace_id | String(100) | Trace ID (optional) |
| method | String(10) | HTTP method (optional) |
| url | String(500) | Request URL (optional) |
| success | Boolean | Operation success (default: true) |
| status_code | Int | HTTP status code (optional) |
| error_code | String(50) | Error code (optional) |
| error_message | Text | Error message (optional) |
| exception_type | String(255) | Exception type (optional) |
| before_json | JSON | State before change (optional) |
| after_json | JSON | State after change (optional) |
| diff_json | JSON | Computed diff (optional) |
| request_json | JSON | Request payload (optional) |
| response_json | JSON | Response payload (optional) |
| logging_level | String(20) | Log level (default: "STANDARD") |
| redacted_fields | String[] | Redacted field names |
| truncated_fields | String[] | Truncated field names |
| data_hash | String(64) | Data hash (optional) |
| tags | JSON | Additional tags (optional) |
| notes | Text | Additional notes (optional) |
| msg | Text | Log message (optional) |

---

## Enums

### UserTier
- `free`
- `premium`

### MemoryState
- `SAVED`
- `DRAFT`
- `DELETED`

### StorageStrategy
- `generic` - Data stored in memories.data as JSONB
- `structured` - Data stored in dedicated table

### EnrichmentStatus
- `pending`
- `processing`
- `completed`
- `failed`
- `queued_budget`

### ReminderStatus
- `pending`
- `sent`
- `cancelled`

### LinkType
- `locatedAt` - Memory is located at another memory (location)
- `summaryOf` - Memory summarizes another memory
- `hasMedia` - Memory has media attachment (another memory)
- `related` - Generic relationship
- `mentions` - Memory mentions a person/entity

### TranscriptStatus
- `none`
- `partial`
- `full`
- `failed`

### TranscriptSource
- `captions`
- `auto`
- `asr`
- `manual`
- `unknown`

### IngestionStatus
- `queued`
- `ingested`
- `retry`
- `failed`
- `blocked`

---

## Indexes

### Key Indexes for Performance

**memories:**
- `userId, state`
- `userId, contentHash, createdAt`
- `occurredAt`
- `locationId`, `personId`, `youtubeVideoId`, `tiktokVideoId`

**embeddings_partition_X:**
- HNSW index on vector column for similarity search

**images:**
- `userId, sha256` (unique)
- `userId`, `sha256`, `phash`

**url_pages:**
- `userId, urlHash` (unique)
- `userId`, `urlHash`, `url`

**youtube_videos:**
- `platform, youtubeVideoId` (unique)
- `canonicalUrl` (unique)
- `channelId`, `publishedAt`, `ingestedAt`, `languageCode`, `ingestionStatus`, `contentHash`

**tiktok_videos:**
- `platform, tiktokVideoId` (unique)
- `canonicalUrl` (unique)
- `creatorId`, `creatorUsername`, `publishedAt`, `ingestedAt`, `ingestionStatus`, `contentHash`

**audit_trail:**
- `userId`, `createdAt`, `entityName, entityId`, `requestId`, `eventType`, `success, createdAt`, `actorType, createdAt`

---

*Last Updated: 2025-12-30*
