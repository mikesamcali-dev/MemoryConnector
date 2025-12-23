# Memory Connector - Architecture Documentation

## Overview

Memory Connector is a full-stack application for capturing, organizing, and searching personal memories with AI-powered enrichment.

## System Architecture

### Tech Stack

- **Backend**: NestJS (Node.js + TypeScript)
- **Frontend**: React + Vite + TypeScript
- **Database**: PostgreSQL 16 with pgvector extension
- **Cache/Queue**: Redis
- **AI**: OpenAI (embeddings, classification)
- **ORM**: Prisma

## Module Structure

### Backend Modules

1. **Auth Module**: JWT authentication with refresh tokens
2. **Users Module**: User management
3. **Memories Module**: Memory CRUD with idempotency and deduplication
4. **Search Module**: Semantic + keyword search
5. **Reminders Module**: Reminder inbox
6. **Usage Module**: Tier-based usage limits
7. **Idempotency Module**: Request replay protection
8. **AI Circuit Breaker**: Cost guardrails
9. **Enrichment Module**: AI-powered memory classification
10. **Embeddings Module**: Vector generation and storage

### Frontend Structure

- **Pages**: Login, Signup, Capture, Search, Reminders, Settings
- **Components**: ProtectedRoute, SyncToast, etc.
- **Hooks**: useAuth, useOfflineSync
- **Services**: offline-queue (IndexedDB)
- **API Client**: Typed API calls with auto-refresh

## Data Flow

### Memory Creation Flow

1. User submits memory via frontend
2. Frontend generates idempotency key
3. Request sent to API with Idempotency-Key header
4. Idempotency interceptor checks/replays if duplicate
5. Usage limit guard checks tier limits
6. Duplicate detection checks content hash
7. Memory created in database
8. Usage counter incremented
9. Enrichment queued (circuit breaker checked)
10. Response returned with enrichment status

### Search Flow

1. User enters search query
2. Frontend calls search API
3. Backend tries semantic search (pgvector)
4. If semantic fails, falls back to keyword search (FTS)
5. Results returned with `degraded` flag if keyword used
6. Frontend shows degraded banner if needed

### Offline Sync Flow

1. User saves memory while offline
2. Memory stored in IndexedDB queue
3. Toast shows "Saved offline" message
4. When online, background sync processes queue
5. Each queued memory synced with existing idempotency key
6. Handles conflicts (DUPLICATE_CONTENT, LIMIT_EXCEEDED)
7. Toast updates when sync completes

## Security

- **Authentication**: JWT access tokens (15min) + refresh tokens (30d, httpOnly cookie)
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Tier-based (free: 100/min, premium: 1000/min)
- **Input Validation**: Zod schemas + class-validator
- **Headers**: Helmet.js security headers
- **CORS**: Configured for web origin only

## Database Schema

### Key Tables

- `users`: User accounts with tier
- `user_usage`: Daily/monthly usage counters
- `tier_limits`: Configurable tier limits
- `memories`: Memory content with state
- `embeddings`: Partitioned vector storage (16 partitions)
- `reminders`: Scheduled reminders
- `idempotency_keys`: Request replay cache
- `ai_cost_tracking`: AI operation costs

### Indexes

- Full-text search: GIN index on `text_search_vector`
- Vector search: HNSW indexes on each embedding partition
- Usage tracking: Indexes on user_id + date combinations

## AI Cost Management

### Circuit Breaker

- **States**: CLOSED (normal), OPEN (blocked), QUEUE_ONLY
- **Triggers**: 100% of daily budget
- **Recovery**: Auto-reset at midnight

### Per-User Limits

- Embeddings: 100/day
- Classifications: 50/day

### Budget Tracking

- Redis counter for fast checks
- Database for historical tracking
- Materialized view for daily summaries

## Offline Support

### IndexedDB Structure

- `pending-memories`: Queue of unsynced memories
- `drafts`: Expired queue items moved to drafts

### Queue Management

- Max size: 50 items
- TTL: 24 hours
- Auto-sync when online
- Conflict resolution for duplicates

## Deployment

### Docker Compose

- Development: Hot reload with volume mounts
- Production: Multi-stage builds, optimized images

### Environment Variables

See `.env.example` files in each app directory.

## Monitoring

- **Logging**: Pino with structured logs
- **Metrics**: Prometheus endpoint (placeholder)
- **Health**: `/api/v1/health` endpoint
- **Alerts**: Slack integration for cost spikes

