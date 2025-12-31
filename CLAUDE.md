# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Memory Connector is a full-stack TypeScript application for capturing, organizing, and searching personal memories with AI-powered enrichment. The system uses semantic search via OpenAI embeddings and includes offline-first capabilities with sophisticated idempotency and deduplication.

**Tech Stack:**
- Backend: NestJS with Prisma ORM
- Frontend: React + Vite
- Database: PostgreSQL 16 with pgvector extension
- Cache/Queue: Redis
- AI: OpenAI (embeddings, classification)

## Development Commands

### Initial Setup (Windows)
```powershell
# Install dependencies
pnpm install

# Start database and Redis (Docker required)
pnpm db:up

# Setup database (first time only)
cd apps\api
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### Development
```powershell
# Start all services (root level)
pnpm dev

# Or start services separately:
# Terminal 1: Backend API
cd apps\api
pnpm dev

# Terminal 2: Frontend
cd apps\web
pnpm dev
```

### Testing
```powershell
# Run all tests
pnpm test

# Backend unit tests
cd apps\api
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:e2e

# Frontend tests
cd apps\web
pnpm test
pnpm test:e2e  # Playwright E2E tests
```

### Database Management
```powershell
# From root:
pnpm db:up              # Start PostgreSQL + Redis containers
pnpm db:down            # Stop containers
pnpm db:migrate         # Run migrations
pnpm db:seed            # Seed test data

# From apps/api:
pnpm db:generate        # Generate Prisma client (run after schema changes)
pnpm db:studio          # Open Prisma Studio GUI
```

### Code Quality
```powershell
pnpm lint               # Lint all workspaces
pnpm typecheck          # Type check all workspaces
pnpm format             # Format code with Prettier
pnpm format:check       # Check formatting
```

### Docker
```powershell
pnpm compose:up         # Start all services with Docker Compose
pnpm compose:down       # Stop all services
```

### Utilities (Windows)
```powershell
pnpm check:windows      # Health check for Windows setup
pnpm reset:windows      # Clean environment and reset
```

## Architecture Key Points

### Memory Creation Flow
1. Frontend generates idempotency key and submits memory
2. Idempotency interceptor checks/replays duplicate requests
3. Usage limit guard validates tier limits (free: 10/day, premium: 100/day)
4. Duplicate detection checks content hash (SHA-256)
5. Memory saved to database with SAVED state
6. Usage counter incremented
7. AI enrichment queued (subject to circuit breaker)
8. Response returned with enrichment status

### Idempotency System
- **Required Header:** `Idempotency-Key` on all POST /memories requests
- **Storage:** Redis cache (24h TTL) + PostgreSQL persistence
- **Behavior:** Returns cached response (200) for duplicate keys with identical request bodies
- **Error Cases:**
  - Same key + different body → `IDEMPOTENCY_KEY_REUSED` (422)
  - Concurrent requests with same key → `DUPLICATE_REQUEST` (409)

### Duplicate Detection
- Content hashing on `textContent` using SHA-256
- Returns `DUPLICATE_CONTENT` (409) if hash exists for user
- Independent from idempotency (different purposes)

### Search System
1. **Primary:** Semantic search using pgvector with OpenAI embeddings
2. **Fallback:** PostgreSQL full-text search (FTS) with GIN index
3. Response includes `degraded: true` flag when keyword search used
4. Frontend shows degraded banner when semantic search unavailable

### AI Circuit Breaker
- **States:** CLOSED (normal), OPEN (blocked), QUEUE_ONLY
- **Triggers:** Daily budget threshold (configurable, default 100% of budget)
- **Recovery:** Auto-reset at midnight
- **Tracking:** Redis counter + PostgreSQL `ai_cost_tracking` table
- **Per-user limits:** Embeddings (100/day), Classifications (50/day)

### Offline Support
- Frontend uses IndexedDB (`idb` library) to queue memories when offline
- Queue stored in `pending-memories` object store (max 50 items, 24h TTL)
- Background sync processes queue when connection restored
- Preserves original idempotency keys for proper deduplication
- Conflict resolution handles `DUPLICATE_CONTENT` and `LIMIT_EXCEEDED` errors

## Module Structure

### Backend (apps/api/src)

**Note:** There are TWO module directories in the codebase:
- `apps/api/src/modules/` - Newer structured modules (usage, etc.)
- `apps/api/src/<module-name>/` - Original flat structure

When working with modules, be aware of this dual structure and ensure imports reference the correct path.

**Core Modules:**
- **auth:** JWT authentication with refresh tokens (15min access, 30d refresh)
- **users:** User management with RBAC
- **memories:** CRUD with state machine (SAVED → ENRICHING → ENRICHED), supports hybrid memory types
- **search:** Semantic + keyword search with fallback
- **reminders:** Reminder inbox with read/dismiss states
- **usage:** Tier-based limits with daily/monthly tracking
- **idempotency:** Request replay protection with Redis + PostgreSQL
- **duplicate-detection:** Content-based deduplication
- **embeddings:** Vector generation and partitioned storage (16 partitions)
- **enrichment:** AI-powered classification (category, tags, sentiment), background worker with 5s polling
- **ai-circuit-breaker:** Cost guardrails and budget tracking
- **metrics:** Prometheus endpoint (placeholder)
- **health:** Health check endpoint
- **admin:** Admin-only operations, memory type management

**Hybrid Memory Types Modules:**
- **events:** Structured storage for events with start/end times
- **locations:** Structured storage for locations with coordinates
- **people:** Structured storage for people and relationships
- **words:** Structured storage for vocabulary words
- **spell-check:** Dictionary-based spell checking
- **user-preferences:** User-specific settings (e.g., reminder preferences)

### Frontend (apps/web/src)
- **pages:** Login, Signup, Capture, Search, Reminders, Settings
- **components:** ProtectedRoute, SyncToast, UI components
- **hooks:** useAuth, useOfflineSync
- **contexts:** AuthContext
- **api:** Typed API client with auto-refresh
- **services/offline-queue:** IndexedDB queue management

## Important Implementation Details

### Authentication
- Access tokens (JWT) expire in 15 minutes
- Refresh tokens stored in httpOnly cookies (30 day TTL)
- Frontend auto-refreshes tokens on 401 responses
- Logout revokes refresh tokens in database

### Database Schema

**Hybrid Memory Types Architecture:**
The system implements a hybrid storage pattern where memories can use either:
- **Generic storage**: Data in `memories.data` (JSONB) - flexible, no migrations needed
- **Structured storage**: Dedicated tables (`events`, `locations`, `people`, `words`) - optimized queries

**Key Tables:**
- **users:** Includes tier (free/premium) and roles
- **memories:** Root entity for all memories. Has `content_hash` for deduplication, `state` for enrichment tracking, optional 1:1 relations to structured types
- **memory_types:** Admin-controlled registry defining available memory types and their storage strategy
- **memory_type_assignments:** Many-to-many linking memories to types (allows multi-typing)
- **memory_links:** Generic relationship system (LinkType: locatedAt, summaryOf, hasMedia, related, mentions)
- **embeddings_partition_X:** 16 partitioned tables (X=0-15) with HNSW indexes for vector search
- **events/locations/people/words:** Structured storage tables (1:1 with memories via `memory_id`)
- **user_usage:** Tracks daily/monthly counters per user per operation type
- **tier_limits:** Configurable limits per tier and operation
- **idempotency_keys:** Request cache with 24h cleanup job

**Important:** When querying raw SQL with Prisma (`$queryRaw`), PostgreSQL returns numeric columns as JavaScript `BigInt` which cannot be serialized to JSON. Always convert with `Number()` before returning from API endpoints.

### Security
- Helmet.js security headers
- CORS restricted to frontend origin (http://localhost:5173 in dev)
- Rate limiting via @nestjs/throttler (tier-based: free=100/min, premium=1000/min)
- Password hashing with argon2
- Input validation with class-validator and Zod schemas

### Logging
- Pino structured logging with pretty-print in development
- Log levels: debug, info, warn, error
- Request logging via LoggingInterceptor

## Common Tasks

### Adding a New API Endpoint
1. Create/update module in `apps/api/src/{module}/`
2. Add DTOs with class-validator decorators
3. Add Swagger decorators (@ApiOperation, @ApiResponse)
4. Implement guard/middleware if needed
5. Add tests in `{module}.service.spec.ts` and `{module}.controller.spec.ts`
6. Update API client in `apps/web/src/api/`

### Modifying Database Schema
1. Edit `apps/api/prisma/schema.prisma`
2. Run `cd apps\api && pnpm db:generate` (generates Prisma client)
3. Run `pnpm db:migrate` from root (creates migration)
4. Update seed script if needed (`apps/api/prisma/seed.ts`)
5. **Important:** If adding new modules that use PrismaService, ensure the module imports `PrismaModule` in its `@Module()` decorator

### Adding a New Structured Memory Type
1. Add enum value to `MemoryType` in schema.prisma if needed
2. Create dedicated table (e.g., `model Event`) with `memoryId` foreign key to `memories.id`
3. Add 1:1 relation in `Memory` model (e.g., `event Event?`)
4. Generate migration: `cd apps\api && pnpm db:generate && pnpm db:migrate`
5. Create NestJS module in `apps/api/src/<type-name>/` with controller, service, DTOs
6. Register in `memory_types` table via admin endpoint or seed script
7. Update frontend to handle the new type in capture/display flows

### Adding Frontend Features
1. Create page in `apps/web/src/pages/`
2. Add route in `apps/web/src/App.tsx`
3. Use `useAuth` hook for protected routes
4. Use `useOfflineSync` for offline-capable mutations
5. Generate idempotency keys with `crypto.randomUUID()`

### Testing Offline Functionality
1. Start app normally
2. Open Chrome DevTools → Network tab
3. Set throttling to "Offline"
4. Create memories (should queue in IndexedDB)
5. Check Application tab → IndexedDB → `memory-connector` → `pending-memories`
6. Restore network
7. Verify automatic sync in console logs

## Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **API Docs (Swagger):** http://localhost:4000/api/v1/docs
- **Prisma Studio:** Run `cd apps\api && pnpm db:studio`

## Test Credentials (after seeding)
- Email: test@example.com
- Password: password123

## Troubleshooting

### Port Already in Use
```powershell
# Find and kill process using port 4000
netstat -ano | findstr :4000
taskkill /PID <process-id> /F
```

### Prisma Client Errors
```powershell
cd apps\api
pnpm db:generate
```

### Database Connection Issues
```powershell
# Verify containers running
docker ps

# Check PostgreSQL logs
docker logs memory-connector-postgres

# Test connection
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "SELECT 1;"
```

### pgvector Extension Missing
```powershell
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### BigInt Serialization Errors
If you see "Do not know how to serialize a BigInt" errors:
- PostgreSQL returns numeric columns as BigInt objects via `$queryRaw`
- Convert to numbers before returning: `Number(data.fieldName)`
- Affects fields like counts, IDs, and storage bytes

## Additional Documentation

For more details, see:
- `Docs/HYBRID_MEMORY_TYPES.md` - Hybrid storage architecture details
- `Docs/DEBUGGING_AND_TESTING_WINDOWS.md` - Windows-specific debugging
- `Docs/FINAL_MVP_STATUS.md` - Complete feature status and architecture
- `Docs/GODADDY_DEPLOYMENT_GUIDE.md` - Production deployment guide
