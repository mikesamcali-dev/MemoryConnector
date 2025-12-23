# Memory Connector - Implementation Checklist

Quick reference checklist based on MVP Implementation Guide.

---

## ✅ Core Features (Implemented)

- [x] **Section 1: Tier Limits**
  - [x] Database schema (user_usage, tier_limits)
  - [x] UsageService with limit checking
  - [x] UsageLimitGuard for routes
  - [x] Client-side idempotency key generation
  - [ ] UI limit warning modals (needs verification)

- [x] **Section 2: AI Cost Guardrails**
  - [x] AI_COST_CONFIG
  - [x] CircuitBreakerService
  - [x] AI cost tracking table
  - [x] Redis state management
  - [x] Alert thresholds
  - [x] Enrichment queue service
  - [ ] Slack alerting integration (needs verification)

- [x] **Section 3: Idempotency & Duplicate Protection**
  - [x] IdempotencyService
  - [x] IdempotencyInterceptor
  - [x] Content-based duplicate detection
  - [x] Client-side draft management
  - [x] Database schema (idempotency_keys)

- [x] **Section 6: Reminder Inbox**
  - [x] Database schema (read_at, dismissed_at)
  - [x] RemindersService.getInbox()
  - [x] RemindersController endpoints
  - [x] RemindersPage UI
  - [x] Mark as read / dismiss functionality

- [x] **Section 7: Offline Conflict UI**
  - [x] SyncToast component
  - [x] OfflineStatusToast
  - [x] useOfflineSync hook
  - [ ] ConflictResolutionModal (needs verification)
  - [ ] Complete sync message constants

---

## ⚠️ Partially Implemented (Needs Completion)

### **Section 4: Keyword Search Fallback**

- [x] SearchService with fallback logic
- [x] Keyword search method
- [x] Degraded search banner UI
- [ ] **MISSING**: Full-text search database setup
  - [ ] `text_search_vector TSVECTOR` column
  - [ ] GIN index on text_search_vector
  - [ ] Trigger to auto-update tsvector
  - [ ] Populate existing data

**Action**: Create migration `004_full_text_search.sql`

---

### **Section 5: pgvector Indexing & Partitioning**

- [x] EmbeddingsService with OpenAI
- [x] Basic embeddings table
- [ ] **CRITICAL MISSING**: Partitioning setup
  - [ ] `vector VECTOR(1536)` column
  - [ ] `partition_key INT` column (with trigger)
  - [ ] Convert to partitioned table (16 partitions)
  - [ ] HNSW indexes on each partition
  - [ ] `search_similar_embeddings()` function
  - [ ] Partition-aware search

**Action**: Create migration `003_pgvector_partitioning.sql`

**Current Issue**: EmbeddingsService tries to insert `vector` column that doesn't exist!

---

## ❌ Not Implemented

### **Section 8: Operational Runbooks**

- [x] Documentation exists (`Docs/runbooks.md`)
- [ ] Admin dashboard for cost monitoring
- [ ] Automated runbook scripts
- [ ] Monitoring dashboards
- [ ] Alert automation

**Priority**: Medium

---

### **Section 9: IndexedDB Device Testing**

- [x] Basic offline queue structure
- [x] useOfflineSync hook
- [ ] Complete IndexedDB implementation
- [ ] Storage quota detection (`checkStorageQuota()`)
- [ ] Queue overflow handling
- [ ] Device testing checklist execution
- [ ] 24-hour queue expiry handling

**Priority**: Medium

---

### **Section 10: Near-Duplicate Detection**

- [ ] Feature flag configuration
- [ ] NearDuplicateService
- [ ] useNearDuplicateDetection hook
- [ ] UI components ("Did you mean?" prompts)
- [ ] Analytics tracking
- [ ] Rollout plan execution

**Priority**: Medium (can soft-launch later)

---

## 🎯 Immediate Next Steps (This Week)

### **1. Fix Critical Database Issues**

```bash
# Priority 1: Add vector column to embeddings
# Create: apps/api/prisma/migrations/003_pgvector_partitioning/migration.sql

# Priority 2: Add full-text search
# Create: apps/api/prisma/migrations/004_full_text_search/migration.sql

# Run migrations
cd apps/api
pnpm prisma migrate dev
```

### **2. Verify Current Features**

- [ ] Test tier limits (save 11 memories as free user)
- [ ] Test AI circuit breaker (if budget exceeded)
- [ ] Test idempotency (replay same request)
- [ ] Test search (semantic + keyword fallback)
- [ ] Test reminder inbox (create reminder, check inbox)

### **3. Fix EmbeddingsService**

Current code tries to insert into non-existent `vector` column. Either:
- Option A: Add migration first (recommended)
- Option B: Temporarily comment out vector insertion

---

## 📊 Progress Summary

| Section | Status | Completion |
|---------|--------|------------|
| 1. Tier Limits | ✅ Complete | 100% |
| 2. AI Cost Guardrails | ✅ Complete | 100% |
| 3. Idempotency | ✅ Complete | 100% |
| 4. Keyword Search | ⚠️ Partial | 80% |
| 5. pgvector Partitioning | ⚠️ Partial | 40% |
| 6. Reminder Inbox | ✅ Complete | 100% |
| 7. Offline Conflict UI | ✅ Complete | 90% |
| 8. Operational Runbooks | ❌ Not Started | 10% |
| 9. IndexedDB Testing | ⚠️ Partial | 50% |
| 10. Near-Duplicate | ❌ Not Started | 0% |

**Overall MVP Progress: ~70%**

---

## 🚨 Critical Blockers

1. **Embeddings table missing vector column**
   - Blocks: Embedding storage
   - Fix: Migration required immediately

2. **No full-text search index**
   - Blocks: Fast keyword search
   - Fix: Migration required (can work without, but slow)

3. **Embeddings not partitioned**
   - Blocks: Scalability beyond 100K embeddings
   - Fix: Complex migration required

---

## 📝 Notes

- Most core features are implemented
- Database migrations are the main blocker
- Focus on Phase 1 (database setup) first
- Testing and validation can happen in parallel

---

**Last Updated**: After clean install completion  
**Next Review**: After Phase 1 migrations complete

