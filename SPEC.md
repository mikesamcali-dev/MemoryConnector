# Memory Connector - Application Specification

**Version:** 1.0.0-MVP
**Last Updated:** December 2025
**Purpose:** Complete specification for recreating the Memory Connector application

---

## Executive Summary

Memory Connector is a personal memory management system that allows users to capture, organize, search, and recall their thoughts, experiences, and knowledge. The system uses AI to automatically enrich memories with semantic embeddings for intelligent search, while maintaining offline-first capabilities and cost-conscious AI usage.

**Core Value Propositions:**
- Capture memories quickly (text, images, voice notes)
- Search memories using natural language (semantic search)
- AI-powered enrichment without breaking the bank
- Works offline with automatic sync
- Intelligent reminders for memories that need follow-up

---

## Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** NestJS (TypeScript-based)
- **Database:** PostgreSQL 16 with pgvector extension
- **ORM:** Prisma
- **Cache/Queue:** Redis 7+
- **AI Services:** OpenAI API (embeddings, text classification)
- **Authentication:** JWT tokens with httpOnly refresh cookies
- **API Documentation:** Swagger/OpenAPI

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **State Management:** React Context API + hooks
- **Offline Storage:** IndexedDB (via idb library)
- **HTTP Client:** Fetch API with auth wrapper

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Package Manager:** pnpm (monorepo workspace)
- **Testing:** Jest (backend), Vitest (frontend), Playwright (E2E)

### Development Tools
- **Linting:** ESLint with TypeScript support
- **Formatting:** Prettier
- **Git Hooks:** Husky + lint-staged
- **Type Safety:** TypeScript 5.3+ strict mode

---

## Architecture Overview

### System Architecture

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ HTTP/REST
       │ JWT Auth
       ▼
┌─────────────────────────────────┐
│       NestJS API Server         │
│  ┌─────────────────────────┐   │
│  │  Controllers & Guards   │   │
│  └───────────┬─────────────┘   │
│              │                  │
│  ┌───────────▼─────────────┐   │
│  │   Business Services     │   │
│  └───────────┬─────────────┘   │
│              │                  │
│  ┌───────────▼─────────────┐   │
│  │   Prisma ORM Layer      │   │
│  └───────────┬─────────────┘   │
└──────────────┼─────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │    Redis    │
│  +pgvector  │  │   Cache     │
└─────────────┘  └─────────────┘
       │
       ▼
┌─────────────────┐
│  OpenAI API     │
│  (Embeddings)   │
└─────────────────┘
```

### Key Architectural Patterns

1. **Monorepo Structure:** Apps and shared packages in single repository
2. **Hybrid Storage Pattern:** Flexible (JSONB) + Structured (dedicated tables) memory types
3. **Offline-First:** Frontend queues operations in IndexedDB when offline
4. **Idempotency:** All mutations protected by idempotency keys (24h window)
5. **Circuit Breaker:** AI operations subject to budget limits with graceful degradation
6. **Background Processing:** Async enrichment queue with polling worker
7. **Partitioned Data:** Embeddings split across 16 tables for performance

---

## Core Features & Use Cases

### 1. User Management

**Use Cases:**
- User signs up with email and password
- User logs in and receives JWT access token (15min) + refresh token (30d)
- User accesses protected resources with auto-refreshing tokens
- User logs out (revokes refresh token)
- Admin users access special admin-only features

**Technical Requirements:**
- Password hashing with argon2
- JWT signed with secret key
- Refresh tokens stored in database for revocation
- Role-based access control (user, admin roles)

### 2. Memory Capture

**Use Cases:**
- User creates a text memory
- User uploads an image with a memory
- User records voice notes (future)
- User assigns memory to one or more types (note, event, location, person, word, etc.)
- User specifies when memory occurred (optional)
- User adds location data (optional)
- System prevents duplicate submissions (idempotency)
- System detects duplicate content (SHA-256 hash)
- System enforces tier limits (free: 10/day, premium: 100/day)

**Technical Requirements:**
- Idempotency-Key header required on all POST requests
- Content hashing to detect duplicates
- Usage tracking per user per day/month
- File upload support (images)
- Metadata storage (title, body, dates, coordinates, custom JSONB)

### 3. Hybrid Memory Types

**Use Cases:**
- System supports generic memory types (data stored as JSONB)
- System supports structured memory types (dedicated tables)
- Admin creates/manages available memory types
- User creates an "event" with start/end times
- User creates a "location" with coordinates and description
- User creates a "person" entry with relationships
- User creates a "word" entry for vocabulary learning
- User links memories together (located at, summary of, mentions, etc.)

**Technical Requirements:**
- memory_types registry table (admin-controlled)
- memory_type_assignments for multi-typing
- Dedicated tables: events, locations, people, words
- 1:1 relationship from structured tables to memories
- memory_links table for generic relationships
- StorageStrategy enum (generic vs structured)

### 4. AI Enrichment

**Use Cases:**
- System automatically generates embeddings for semantic search
- System classifies memories (category, tags, sentiment)
- System processes enrichment asynchronously in background
- System respects daily budget limits (circuit breaker)
- System tracks AI costs per user and globally
- Admin monitors AI spending and circuit breaker status
- User receives alert when approaching budget limits

**Technical Requirements:**
- OpenAI text-embedding-3-small (1536 dimensions)
- OpenAI GPT for classification
- Background worker polling queue every 5 seconds
- Circuit breaker with states: CLOSED, OPEN, QUEUE_ONLY
- Cost tracking in cents (embeddings ~$0.00002, classifications ~$0.001)
- Per-user rate limits (100 embeddings/day, 50 classifications/day)
- Email alerts at 80%, 100% budget thresholds

### 5. Search

**Use Cases:**
- User searches memories using natural language query
- System returns semantically similar results (primary)
- System falls back to keyword search if embeddings unavailable
- User filters by category, date range, memory type
- User paginates through results
- System indicates when degraded mode (keyword-only) is active

**Technical Requirements:**
- pgvector cosine similarity search on embeddings
- PostgreSQL full-text search (FTS) with GIN indexes as fallback
- Hybrid ranking using Reciprocal Rank Fusion (RRF) algorithm
- Embeddings partitioned across 16 tables (partition = user_id hash % 16)
- HNSW indexes on embedding vectors for performance
- Search response includes degraded flag

### 6. Reminders

**Use Cases:**
- System automatically creates reminders for time-sensitive memories
- User views reminder inbox (unread count badge)
- User marks reminder as read
- User dismisses reminder
- User reschedules reminder to different date/time
- User deletes reminder
- User configures reminder preferences (enabled/disabled, timezone)

**Technical Requirements:**
- Reminder generation based on memory dates (events, deadlines, etc.)
- Reminder status: pending, sent, cancelled
- User preferences table for reminder settings
- Timezone support for scheduling
- Automatic reminder creation on memory enrichment

### 7. Usage Limits & Tiers

**Use Cases:**
- Free tier user limited to 10 memories/day, 100/month
- Premium tier user gets 100 memories/day, unlimited/month
- System tracks daily and monthly usage per user
- System resets daily counters at midnight
- System resets monthly counters on 1st of month
- User views usage stats in settings
- System prevents operations when limit exceeded

**Technical Requirements:**
- user_usage table with daily/monthly counters
- tier_limits table defining limits per tier
- Automatic counter resets using database date comparisons
- Usage check guard on memory creation endpoints
- Usage increment/decrement on create/delete operations
- Storage limits tracked (free: 100MB, premium: 1GB)

### 8. Offline Support

**Use Cases:**
- User loses internet connection
- User creates memories while offline (queued in browser)
- User regains connection and queued memories auto-sync
- System resolves conflicts (duplicate content, limit exceeded)
- User sees sync status in UI (pending, syncing, success, error)

**Technical Requirements:**
- IndexedDB queue (pending-memories store)
- Queue max size: 50 items
- Queue TTL: 24 hours
- Background sync on connection restoration
- Preserve original idempotency keys for sync
- Conflict resolution for DUPLICATE_CONTENT and LIMIT_EXCEEDED errors

### 9. Admin Dashboard

**Use Cases:**
- Admin views system statistics (users, memories, AI costs)
- Admin monitors circuit breaker status
- Admin triggers enrichment worker manually
- Admin manages memory types (create, enable/disable, reorder)
- Admin views AI cost tracking history
- Admin inspects enrichment queue status
- Admin manages global words/events/locations dictionaries

**Technical Requirements:**
- Admin role check on all admin endpoints
- Statistics aggregation queries
- Circuit breaker status from Redis
- Memory type CRUD operations
- AI cost tracking with daily/monthly aggregates
- Worker status endpoint (queue size, last run, etc.)

---

## Data Model Overview

### Core Entities

**User**
- id (UUID)
- email (unique)
- passwordHash
- tier (free/premium)
- roles (array: user, admin)
- timestamps

**Memory** (Root entity - all memories start here)
- id (UUID)
- userId
- title, body (text content)
- occurredAt, startAt, endAt (timestamps)
- latitude, longitude (coordinates)
- data (JSONB - flexible metadata)
- contentHash (SHA-256 for duplicate detection)
- state (SAVED, DRAFT, DELETED)
- Relations: embeddings, typeAssignments, event?, location?, person?, word?

**MemoryType** (Admin registry)
- code (unique identifier: "note", "event", "location")
- label (display name)
- storageStrategy (generic/structured)
- tableName (for structured types)
- enabled, sortOrder

**MemoryTypeAssignment** (Many-to-many)
- memoryId
- typeCode
- Allows memories to have multiple types

**MemoryLink** (Generic relationships)
- sourceMemoryId, targetMemoryId
- linkType (locatedAt, summaryOf, hasMedia, related, mentions)

**Embedding** (Partitioned across 16 tables)
- id (UUID)
- memoryId
- userId
- vector (1536 dimensions)
- model (text-embedding-3-small)
- cost (cents)
- Stored in: embeddings_partition_0 through embeddings_partition_15

**Event** (Structured type)
- memoryId (1:1 with Memory)
- startAt, endAt
- location, participants

**Location** (Structured type)
- memoryId (1:1 with Memory)
- name, address, city, country
- latitude, longitude
- placeType, visitCount

**Person** (Structured type)
- memoryId (1:1 with Memory)
- firstName, lastName, nickname
- birthday, email, phone
- relationships (to other people)

**Word** (Structured type)
- memoryId (1:1 with Memory)
- word, definition, partOfSpeech
- language, pronunciation
- exampleSentence

**Reminder**
- memoryId
- userId
- scheduleFor (timestamp)
- status (pending, sent, cancelled)
- message

**UserUsage** (Tier enforcement)
- userId
- memoriesToday, memoriesThisMonth
- imagesThisMonth, voiceThisMonth
- searchesToday
- storageBytes
- lastDailyReset, lastMonthlyReset

**TierLimit** (Configurable limits)
- tier
- memoriesPerDay, memoriesPerMonth
- imagesPerMonth, voicePerMonth
- searchesPerDay
- storageBytes

**IdempotencyKey** (Request deduplication)
- key (UUID from client)
- userId
- requestHash (SHA-256 of request body)
- responseStatus, responseBody
- expiresAt (24h TTL)

**AiCostTracking** (Budget monitoring)
- userId (nullable for global tracking)
- date
- embeddingCost, classificationCost
- embeddingCount, classificationCount

**Session** (Refresh tokens)
- userId
- refreshToken (hashed)
- expiresAt
- revoked

---

## Key Workflows

### Memory Creation Flow

1. Frontend generates UUID idempotency key
2. User fills out memory form (title, body, type, etc.)
3. Frontend submits POST /memories with Idempotency-Key header
4. Backend: IdempotencyInterceptor checks for duplicate key
   - If exists with same request: return cached response (200)
   - If exists with different request: return error (422)
5. Backend: UsageLimitGuard checks user's tier limits
   - If exceeded: return error (403)
6. Backend: DuplicateDetectionService checks content hash
   - If duplicate: return error (409)
7. Backend: Save memory to database (state: SAVED)
8. Backend: Increment usage counter
9. Backend: Queue enrichment job (if budget allows)
10. Backend: Return memory response with enrichmentStatus
11. Frontend: Display success, add to local state

### AI Enrichment Flow

1. Background worker polls enrichment queue (every 5 seconds)
2. Worker: Check circuit breaker state
   - If OPEN: skip processing
   - If QUEUE_ONLY: queue but don't process
   - If CLOSED: proceed
3. Worker: Fetch next pending memory
4. Worker: Generate embedding via OpenAI API
5. Worker: Classify memory (category, tags, sentiment)
6. Worker: Calculate partition (user_id hash % 16)
7. Worker: Save embedding to embeddings_partition_X
8. Worker: Update memory state to ENRICHED
9. Worker: Track costs in ai_cost_tracking
10. Worker: Check if budget threshold exceeded
    - If exceeded: Open circuit breaker, send alert
11. Worker: Create reminders if applicable

### Semantic Search Flow

1. User enters search query
2. Frontend: POST /search with query, filters, pagination
3. Backend: Generate query embedding via OpenAI
4. Backend: Calculate partition for user's embeddings
5. Backend: Query all 16 embedding partitions with cosine similarity
6. Backend: Rank results by similarity score
7. Backend: If embeddings unavailable, fallback to FTS
8. Backend: Apply filters (category, date, type)
9. Backend: Paginate results
10. Backend: Return results with degraded flag
11. Frontend: Display results, show degraded banner if needed

### Offline Sync Flow

1. Browser detects offline state (navigator.onLine = false)
2. User creates memory
3. Frontend: Save to IndexedDB pending-memories store
4. Frontend: Show "Queued for sync" message
5. Browser detects online state
6. Frontend: Fetch items from IndexedDB queue
7. Frontend: For each item, POST to /memories with original idempotency key
8. Backend: Process as normal (idempotency prevents duplicates)
9. Frontend: Handle response
   - Success: Remove from queue, show success
   - DUPLICATE_CONTENT: Remove from queue, show warning
   - LIMIT_EXCEEDED: Remove from queue, show error
   - Other errors: Keep in queue, retry later
10. Frontend: Update sync status UI

---

## Security Considerations

### Authentication & Authorization
- Passwords hashed with argon2 (memory-hard algorithm)
- JWT access tokens short-lived (15 minutes)
- Refresh tokens httpOnly cookies (prevents XSS)
- Refresh tokens stored hashed in database
- Token revocation on logout
- Role-based access control (RBAC) for admin endpoints

### API Security
- Helmet.js security headers (CSP, HSTS, etc.)
- CORS restricted to frontend origin
- Rate limiting per tier (free: 100/min, premium: 1000/min)
- Input validation with class-validator and Zod schemas
- SQL injection prevention via Prisma ORM
- XSS prevention via React's automatic escaping

### Data Protection
- User data isolated by userId in all queries
- No sensitive data in JWT payload
- Environment variables for secrets (.env files)
- Database credentials not committed to repo
- API keys stored in environment, not code

---

## Performance Considerations

### Database Optimization
- Embedding partitioning (16 tables) for horizontal scaling
- HNSW indexes on vectors for fast similarity search
- GIN indexes on full-text search columns
- Composite indexes on frequently queried columns
- Connection pooling via Prisma

### Frontend Optimization
- Code splitting by route (React lazy + Suspense)
- 75% reduction in initial bundle size
- IndexedDB for offline data (not memory-heavy)
- Pagination on all list views
- Debounced search input
- Optimistic UI updates

### Caching Strategy
- Redis for idempotency cache (24h TTL)
- Redis for circuit breaker state
- Redis for session storage
- Query result caching where applicable

### Background Processing
- Async enrichment queue (non-blocking)
- Polling interval: 5 seconds (configurable)
- Batch processing where possible
- Graceful degradation when AI unavailable

---

## Cost Management

### AI Budget Controls
- Daily budget limit (configurable per environment)
- Circuit breaker prevents runaway costs
- Per-user rate limits (100 embeddings/day, 50 classifications/day)
- Cost tracking in cents for accurate monitoring
- Email alerts at 80% and 100% of budget
- Queue-only mode for budget-conscious operation

### Infrastructure Costs
- PostgreSQL: ~$20-50/month (managed service)
- Redis: ~$10-20/month (managed service)
- OpenAI API: ~$5-20/month (1000 users x 10 memories/day)
- Hosting: ~$10-30/month (VPS or container service)

**Estimated monthly cost for 1000 active users:** $45-120

---

## Deployment Architecture

### Development Environment
- Docker Compose with hot reload
- PostgreSQL + Redis containers
- Frontend on localhost:5173
- Backend on localhost:4000
- Prisma Studio on localhost:5555

### Production Environment
- PostgreSQL managed database (AWS RDS, DigitalOcean, etc.)
- Redis managed instance
- Backend deployed as Node.js service (PM2, Docker, or serverless)
- Frontend built and served via CDN or static hosting
- Environment variables for configuration
- SSL/TLS certificates (Let's Encrypt)
- Domain with DNS configuration

### Required Environment Variables
```
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# OpenAI
OPENAI_API_KEY=sk-...

# Email (for alerts)
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...

# App config
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://yourdomain.com
```

---

## Testing Strategy

### Backend Tests
- Unit tests for services (Jest)
- Controller tests with mocked services
- E2E tests with test database
- Integration tests for critical workflows
- Target coverage: 80%+

### Frontend Tests
- Component tests (Vitest + React Testing Library)
- E2E tests with Playwright
- User flow tests (login, create memory, search)
- Offline functionality tests
- Target coverage: 70%+

### Manual Testing
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness
- Offline mode
- Error scenarios (network failures, API errors)
- Performance testing (large datasets)

---

## Future Enhancements (Post-MVP)

### Features
- Voice note recording and transcription
- OCR for image text extraction
- Sharing memories with other users
- Export to PDF/JSON
- Memory collections/notebooks
- Graph visualization of memory links
- Mobile app (React Native)
- Browser extension for quick capture

### Technical
- Real-time collaboration (WebSockets)
- Multi-language support (i18n)
- Advanced analytics dashboard
- Webhook integrations
- Public API with rate limiting
- Automated backups
- Elasticsearch for advanced search

---

## Success Metrics

### User Engagement
- Daily active users (DAU)
- Memories created per user per week
- Search queries per user per week
- Retention rate (7-day, 30-day)

### System Performance
- API response time (p50, p95, p99)
- Search response time
- Uptime percentage (target: 99.5%)
- Error rate (target: <1%)

### Cost Efficiency
- AI cost per user per month
- Infrastructure cost per user
- Ratio of free to premium users

### Quality Metrics
- Test coverage (backend: 80%+, frontend: 70%+)
- TypeScript strict mode compliance (100%)
- Zero high-severity security vulnerabilities
- Lighthouse score (Performance: 90+, Accessibility: 95+)

---

## Conclusion

Memory Connector is a sophisticated yet approachable personal memory management system that balances modern AI capabilities with practical cost constraints. The hybrid storage architecture provides flexibility for future growth, while the offline-first approach ensures reliability in real-world conditions.

The system is production-ready and designed for horizontal scaling as the user base grows. The modular architecture allows for incremental feature additions without major refactoring.

**Key Differentiators:**
- Offline-first with automatic sync
- Cost-conscious AI usage with circuit breakers
- Flexible hybrid storage for rapid iteration
- Comprehensive idempotency and duplicate detection
- Role-based admin controls for power users

This specification provides the blueprint for recreating Memory Connector or building similar systems that require intelligent data management with AI enhancement.
