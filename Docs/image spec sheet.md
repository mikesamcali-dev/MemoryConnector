# Memory Connector Image Ingestion and Recognition Spec

Version: 1.0  
Last updated: 2025-12-30

## Goal

Ingest an uploaded image (or mobile capture), extract metadata, detect faces, optionally generate biometric embeddings with explicit consent, match faces to existing People records, upload assets to Cloudflare storage, persist links and metadata in the database, and return a JSON action plan for the orchestration layer.

## Scope

In scope:
- Image validation, decoding, and normalization
- EXIF extraction and metadata merging
- Thumbnail generation and optional face crops
- Face detection and optional face embeddings generation
- Face-to-person matching with confidence thresholds
- Duplicate detection using hashes
- Cloudflare object storage upload (original + derivatives)
- Database persistence (image record, face record, person links)
- Confirmation flows for ambiguous or mid-confidence matches
- Privacy, consent, retention, and deletion mechanics

Out of scope:
- UI implementation details beyond required prompts
- Long-term model training
- Cross-user face matching unless explicitly enabled and consented

## Definitions

- Image: Original uploaded photo in supported format.
- Normalized image: Image rotated and transformed so orientation is correct.
- Face detection: Finding face bounding boxes.
- Embedding: Numeric vector representing a face for similarity matching.
- Match score: Similarity score between face embedding and stored embeddings.
- Dedupe: Preventing duplicate storage of identical or near-identical images.

## Inputs

All requests are JSON. Binary transport is permitted.

### Request object

Required fields:
- request_id (string, unique, UUID preferred)
- image.content_type (string)
- consent.consent_store_image (boolean)

Recommended fields:
- user_id (string)
- image.data_base64 (string) OR binary bytes provided out-of-band
- image.bytes_length (number)
- image.filename (string)
- provided_metadata.timestamp_utc (ISO-8601)
- provided_metadata.location (lat, lon, accuracy_m, source)
- db configuration (snapshot or api)
- storage configuration
- config overrides

### Image formats

Default allowed types:
- image/jpeg
- image/png
- image/webp
- image/heic

Default max size:
- 25 MB

## Outputs

Responses must be JSON only.

### Response fields

- request_id (string)
- action_plan (array of steps for the caller)
- storage_url (string or null)
- metadata_extracted (object)
- faces_detected (array)
- matched_persons (array)
- suggested_new_person (object)
- user_prompts (array)
- audit_log_entry (object)
- error (object or null)

### Error object shape

- code (string)
- message (string)
- is_transient (boolean)
- retry_after_ms (number or null)
- details (object)

## Processing Pipeline

Follow this order.

1. Validate request and consent
   - Require consent_store_image=true for any storage.
   - Validate content_type is in allowed list.
   - Validate size if bytes_length is provided.
   - If missing required consent or invalid input, return error plus user_prompts.

2. Decode and normalize image
   - If data_base64 exists, decode to bytes.
   - If binary transport, action_plan must reference caller-provided bytes.
   - Extract EXIF orientation then rotate to normalized orientation.
   - If HEIC, convert to JPEG for downstream processing while preserving original for storage.

3. Extract metadata
   - Extract EXIF when available:
     - timestamp, GPS, camera make/model, orientation, lens data
   - Merge provided_metadata:
     - Prefer user-provided timestamp/location when present.
   - Track source for each field: user, exif, none.

4. Generate derivatives
   - Thumbnail 256px longest side
   - Thumbnail 1024px longest side
   - Optional face crops for confirmation UI
   - Store temporary refs in action_plan outputs

5. Detect faces
   - Run face detection on normalized image.
   - For each face, return bbox in pixel coordinates and quality metrics.
   - Enforce minimum face size (default 48px).

6. Compute embeddings (biometrics)
   - Only if consent_biometrics=true.
   - Compute embeddings per face and include in faces_detected.
   - If consent_biometrics=false, do not compute and set embedding=null.

7. Scene/object labeling (non-biometric)
   - Optional labeling for “outdoor”, “group photo”, etc.
   - Do not infer sensitive traits.

8. Match faces to People
   - Only if consent_biometrics=true and People embeddings available.
   - db.mode:
     - snapshot: embeddings provided in request
     - api: caller action_plan must fetch embeddings via generic HTTP calls
   - Similarity metric:
     - Default cosine similarity
   - Rank candidates per face by best embedding match per person.

9. Confidence thresholds and decisions

Default thresholds (cosine):
- low_review: 0.40
- confirm: 0.70
- auto_link: 0.90

Decision rules:
- score >= auto_link:
  - auto-link unless ambiguous tie (difference < 0.02)
- confirm <= score < auto_link:
  - requires user confirmation
- low_review <= score < confirm:
  - requires user selection from top candidates plus “new person”
- score < low_review:
  - no match, suggest new person

Ambiguity:
- If top1 - top2 < 0.03 and both >= confirm, require confirmation.

10. Duplicate detection
   - Compute sha256 of original bytes.
   - Compute perceptual hash (pHash) on normalized image.
   - Query DB for:
     - exact sha256 match for user_id
     - near pHash within threshold (default 6)
   - If duplicate found:
     - skip uploads unless configured otherwise
     - return existing storage_url and note in audit_log_entry

11. Upload to Cloudflare storage
   - Preserve original file and upload derivatives.
   - Prefer presigned URLs if configured.

Object key conventions:
- {user_id}/{yyyy}/{mm}/{request_id}/original.{ext}
- {user_id}/{yyyy}/{mm}/{request_id}/thumb_256.jpg
- {user_id}/{yyyy}/{mm}/{request_id}/thumb_1024.jpg
- {user_id}/{yyyy}/{mm}/{request_id}/face_{face_id}.jpg

12. Persist database records
   - Upsert image record keyed by request_id for idempotency.
   - Insert face records (bbox, quality, optional embedding reference).
   - Create ImagePersonLink records only after:
     - auto-link decision, or
     - user confirmed selection
   - Store embeddings only if:
     - consent_biometrics=true
     - user confirmed storing biometric data where required by policy

13. Return response
   - Include storage_url and derivative keys.
   - Include user_prompts if confirmation is needed.
   - Include audit_log_entry with privacy signals and delete_plan.

## Matching Logic Details

### Similarity metric

Cosine similarity recommended.

cosine(a,b) = (a·b) / (||a|| * ||b||)

- Range: -1 to 1
- Higher is more similar
- Default thresholds assume cosine

### Multiple embeddings per person

- Compute similarity against each stored embedding.
- Use best score per person:
  best_score(person) = max(cos(face_embedding, person_embedding_i))

### Multiple faces per image

- Match each face independently.
- Prevent linking the same person to multiple faces unless user confirms (optional rule).

## User Interaction and Confirmation

Return prompts in user_prompts when needed.

Prompt types:
- consent_store_image
- consent_biometrics
- select_from_candidates
- confirm_person_match
- enter_new_person_name

When to prompt:
- consent_store_image is false or missing
- consent_biometrics is false but matching requested
- score in confirm band or ambiguous
- score in low_review band
- no match and user should create a new person
- multiple faces detected and tagging required

New person flow:
- Provide cropped face thumbnail temp ref.
- Ask for name input.
- Create new person record then link.

## Storage Requirements (Cloudflare R2)

- Use presigned PUT URLs when possible.
- Store original plus thumbnails.
- Store face crops only when needed for user confirmation.
- Avoid public URLs unless required. Prefer signed download URLs.

## Database Requirements

Minimum tables or collections (conceptual):
- People
  - person_id
  - display_name
- PersonEmbeddings (biometric)
  - embedding_id
  - person_id
  - vector
  - model
  - created_at
- Images
  - image_id
  - request_id
  - user_id
  - storage_url
  - sha256
  - phash
  - timestamp_utc
  - location
  - exif_json
  - created_at
- ImageFaces
  - face_id
  - image_id
  - bbox
  - quality_json
  - embedding_id (optional)
- ImagePersonLinks
  - image_id
  - person_id
  - face_id (optional)
  - link_confidence
  - link_method (auto|confirmed|manual)
  - created_at

Idempotency:
- Upsert Images by request_id to avoid duplicates on retry.

## Privacy and Security

Consent gates:
- Require consent_store_image=true to upload and store.
- Require consent_biometrics=true to compute or store embeddings.

Data minimization:
- Do not compute embeddings without consent.
- Store face crops only for confirmation, delete quickly after.

Sensitive inference:
- Do not infer race, religion, health, or other sensitive traits.

Encryption:
- Use encryption at rest for storage and database.
- Use TLS for all network calls.
- Restrict access to presigned URLs and rotate keys.

Retention:
- Recommend deleting face crops after confirmation within 24 hours.
- Define retention periods for originals and thumbnails in product policy.

Deletion:
- Support delete by request_id:
  - delete storage objects for original and derivatives
  - delete DB image, face, link records
  - delete embeddings if tied exclusively to deleted items or per user request

Audit logging:
- Log all ingest events with:
  - consent flags
  - upload keys
  - matching decisions
  - prompts issued
  - errors and retries

## Error Handling

Errors must include is_transient and retry_after_ms when relevant.

Common codes:
- INVALID_IMAGE
- IMAGE_TOO_LARGE
- CONSENT_REQUIRED_IMAGE
- CONSENT_REQUIRED_BIOMETRICS
- METADATA_EXTRACTION_FAILED (non-fatal if possible)
- RECOGNITION_TIMEOUT (transient)
- STORAGE_UPLOAD_FAILED (transient)
- DB_UNAVAILABLE (transient)

Retry policy:
- Exponential backoff recommended: 1000ms, 2000ms, 5000ms
- Max 3 attempts for transient errors
- Do not retry non-idempotent writes without idempotency_key=request_id

## Action Plan Step Enums

Use only:
- validate_request
- decode_image
- extract_exif
- normalize_orientation
- generate_thumbnails
- detect_faces
- compute_face_embeddings
- label_scene
- fetch_people_embeddings
- match_faces_to_people
- compute_hashes
- dedupe_check_db
- create_presigned_upload_urls
- upload_original
- upload_thumbnails
- upload_face_crops
- db_upsert_image_record
- db_upsert_face_records
- db_create_image_person_links
- db_store_person_embeddings
- finalize_response

## Environment Variables

- CLOUDFLARE_ACCOUNT_ID
- STORAGE_BUCKET
- STORAGE_PUBLIC_BASE_URL (optional)
- DB_BASE_URL (if db.mode=api)
- DB_API_KEY
- RECOGNITION_SERVICE_URL
- RECOGNITION_SERVICE_API_KEY
- EXIF_SERVICE_URL (optional)
- EXIF_SERVICE_API_KEY (optional)

## Testing Checklist

Unit tests:
- cosine similarity correctness
- threshold decision logic
- ambiguity rules
- multiple-face handling

Integration tests:
- EXIF extraction across devices
- orientation normalization
- thumbnail generation

End-to-end tests:
- ingest -> upload -> DB write -> read back URLs
- dedupe detection prevents re-upload
- confirmation flow results in correct links

Privacy tests:
- embeddings never computed or returned if consent_biometrics=false
- face crops not persisted when not needed
- delete by request_id removes all objects and records
