# Memory Connector - Next Steps Roadmap

> **Status**: Based on MVP Implementation Guide analysis  
> **Last Updated**: After clean install completion

---

## 📊 Implementation Status Summary

### ✅ **Fully Implemented** (Ready for Production)

1. **Tier Limits (Section 1)** ✅
   - UsageService with limit checking
   - UsageLimitGuard for route protection
   - Database schema (user_usage, tier_limits)
   - Client-side idempotency key generation

2. **AI Cost Guardrails (Section 2)** ✅
   - CircuitBreakerService with Redis state management
   - AI cost tracking table and recording
   - Alert thresholds and Slack integration
   - Enrichment queue service

3. **Idempotency & Duplicate Protection (Section 3)** ✅
   - IdempotencyService with request replay
   - IdempotencyInterceptor for automatic handling
   - Content-based duplicate detection
   - Client-side draft management

4. **Reminder Inbox (Section 6)** ✅
   - RemindersService with inbox API
   - RemindersController endpoints
   - RemindersPage UI component
   - Read/dismiss functionality

5. **Offline Conflict UI (Section 7)** ✅
   - SyncToast component
   - OfflineStatusToast
   - useOfflineSync hook
   - Basic conflict handling

---

### ⚠️ **Partially Implemented** (Needs Completion)

#### 6. **Keyword Search Fallback (Section 4)** - 80% Complete

**What's Done:**
- ✅ SearchService with automatic fallback logic
- ✅ Keyword search method implemented
- ✅ Degraded search banner in SearchPage

**What's Missing:**
- ❌ Full-text search database setup (tsvector column)
- ❌ GIN index for text_search_vector
- ❌ Trigger to auto-update tsvector on insert/update

**Priority**: **HIGH** - Required for production search reliability

**Next Steps:**
1. Create migration to add `text_search_vector TSVECTOR` column
2. Create GIN index
3. Create trigger function to auto-populate
4. Populate existing data

---

#### 7. **pgvector Indexing & Partitioning (Section 5)** - 40% Complete

**What's Done:**
- ✅ EmbeddingsService with OpenAI integration
- ✅ Basic embeddings table (non-partitioned)
- ✅ search_similar_embeddings function (assumed)

**What's Missing:**
- ❌ **CRITICAL**: Embeddings table is NOT partitioned
- ❌ No `vector` column in current schema (only id, memory_id, user_id, model_version)
- ❌ No partition_key column
- ❌ No HNSW indexes on partitions
- ❌ No partition-aware search function

**Priority**: **CRITICAL** - Required for scalable semantic search

**Next Steps:**
1. Create migration to:
   - Add `vector VECTOR(1536)` column
   - Add `partition_key INT` column (with trigger)
   - Convert to partitioned table (16 partitions)
   - Create HNSW indexes on each partition
   - Create `search_similar_embeddings()` function
2. Update EmbeddingsService to use partitioned table
3. Test with load data

---

### ❌ **Not Implemented** (Needs Development)

#### 8. **Near-Duplicate Detection (Section 10)** - 0% Complete

**What's Missing:**
- ❌ Feature flag configuration
- ❌ NearDuplicateService
- ❌ useNearDuplicateDetection hook
- ❌ UI components for "Did you mean?" prompts
- ❌ Analytics tracking

**Priority**: **MEDIUM** - Can be soft-launched later

**Next Steps:**
1. Create feature flag config
2. Implement detection service
3. Create React hook
4. Build UI components
5. Set up analytics

---

#### 9. **Operational Runbooks (Section 8)** - Documentation Only

**What's Done:**
- ✅ Documentation exists in `Docs/runbooks.md`

**What's Missing:**
- ❌ Actual runbook automation scripts
- ❌ Admin dashboard for cost monitoring
- ❌ Automated alerting setup

**Priority**: **MEDIUM** - Important for production operations

---

#### 10. **IndexedDB Device Testing (Section 9)** - Partial

**What's Done:**
- ✅ Basic offline queue service structure
- ✅ useOfflineSync hook

**What's Missing:**
- ❌ Complete IndexedDB implementation
- ❌ Storage quota detection
- ❌ Device testing checklist execution
- ❌ Queue overflow handling

**Priority**: **MEDIUM** - Important for mobile users

---

## 🎯 **Recommended Implementation Order**

### **Phase 1: Critical Database Setup** (Week 1)

**Goal**: Complete database infrastructure for search and embeddings

1. **pgvector Partitioning Migration** (CRITICAL)
   - Create migration file: `003_pgvector_partitioning.sql`
   - Add vector column to embeddings
   - Set up partitioning (16 partitions)
   - Create HNSW indexes
   - Create search function
   - **Estimated Time**: 4-6 hours

2. **Full-Text Search Setup** (HIGH)
   - Create migration: `004_full_text_search.sql`
   - Add tsvector column
   - Create GIN index
   - Create trigger function
   - Populate existing data
   - **Estimated Time**: 2-3 hours

**Deliverables:**
- ✅ Partitioned embeddings table
- ✅ Full-text search working
- ✅ Both search methods functional

---

### **Phase 2: Testing & Validation** (Week 1-2)

**Goal**: Verify all implemented features work correctly

1. **Integration Testing**
   - Test tier limits enforcement
   - Test AI circuit breaker
   - Test idempotency replay
   - Test search fallback
   - Test reminder inbox

2. **Load Testing**
   - pgvector search performance
   - Embedding insertion throughput
   - Search latency benchmarks

**Deliverables:**
- ✅ Test suite passing
- ✅ Performance benchmarks met
- ✅ Documentation updated

---

### **Phase 3: Polish & Enhancements** (Week 2-3)

**Goal**: Complete remaining features and improve UX

1. **IndexedDB Offline Queue** (MEDIUM)
   - Complete implementation
   - Storage quota detection
   - Queue management
   - Device testing

2. **Near-Duplicate Detection** (MEDIUM)
   - Feature flag setup
   - Detection service
   - UI components
   - Soft launch (10% rollout)

3. **Operational Tools** (MEDIUM)
   - Admin dashboard
   - Runbook automation
   - Monitoring setup

**Deliverables:**
- ✅ Complete offline support
- ✅ Near-duplicate detection (soft launch)
- ✅ Operational tools ready

---

## 📋 **Immediate Action Items** (This Week)

### **Priority 1: Database Migrations**

```bash
# 1. Create pgvector partitioning migration
cd apps/api/prisma/migrations
# Create new migration folder with SQL file

# 2. Create full-text search migration
# Create another migration for tsvector setup

# 3. Run migrations
cd apps/api
pnpm prisma migrate dev
```

### **Priority 2: Verify Current Features**

```bash
# Test tier limits
curl -X POST http://localhost:4000/api/v1/memories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: test-123" \
  -d '{"textContent": "Test memory"}'

# Test search fallback (should work even without tsvector)
curl "http://localhost:4000/api/v1/search?q=test" \
  -H "Authorization: Bearer $TOKEN"

# Test reminder inbox
curl "http://localhost:4000/api/v1/reminders/inbox" \
  -H "Authorization: Bearer $TOKEN"
```

### **Priority 3: Fix Embeddings Service**

The current `EmbeddingsService` tries to insert into a `vector` column that doesn't exist. Need to:

1. Either add vector column via migration
2. Or update service to work with current schema (temporary)

---

## 🔍 **Detailed Next Steps by Section**

### **Section 4: Keyword Search Fallback**

**Files to Create:**
- `apps/api/prisma/migrations/004_full_text_search/migration.sql`

**Code to Add:**
```sql
-- Add tsvector column
ALTER TABLE memories ADD COLUMN text_search_vector TSVECTOR;

-- Populate existing data
UPDATE memories 
SET text_search_vector = to_tsvector('english', COALESCE(text_content, ''));

-- Create GIN index
CREATE INDEX idx_memories_fts ON memories USING GIN(text_search_vector);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_text_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.text_search_vector := to_tsvector('english', COALESCE(NEW.text_content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER memories_text_search_update
  BEFORE INSERT OR UPDATE OF text_content ON memories
  FOR EACH ROW EXECUTE FUNCTION update_text_search_vector();
```

---

### **Section 5: pgvector Partitioning**

**Files to Create:**
- `apps/api/prisma/migrations/003_pgvector_partitioning/migration.sql`

**Critical Steps:**
1. Enable pgvector extension
2. Add vector column to embeddings
3. Add partition_key column (with trigger, NOT generated)
4. Convert to partitioned table
5. Create 16 partitions
6. Create HNSW indexes
7. Create search function

**Note**: This is a complex migration. Consider:
- Backing up data first
- Testing on staging
- Running during low-traffic period

---

## 🚨 **Known Issues to Address**

1. **Embeddings Table Missing Vector Column**
   - Current schema has no `vector` column
   - EmbeddingsService will fail when trying to insert
   - **Fix**: Add migration immediately

2. **No Full-Text Search Index**
   - Keyword search works but may be slow
   - **Fix**: Add tsvector column and GIN index

3. **Embeddings Not Partitioned**
   - Will not scale beyond ~100K embeddings
   - **Fix**: Implement partitioning migration

---

## 📚 **Reference Documents**

- **MVP Implementation Guide**: `Docs/MVP_Implementation_Guide.md`
- **Implementation Planning**: `Docs/Implementation_Planning.md`
- **Runbooks**: `Docs/runbooks.md`
- **API Documentation**: `Docs/api.md`

---

## ✅ **Success Criteria**

### Phase 1 Complete When:
- [ ] pgvector partitioning migration runs successfully
- [ ] Full-text search migration runs successfully
- [ ] Both semantic and keyword search work
- [ ] Embeddings can be stored and retrieved
- [ ] Search performance meets targets (<100ms P95)

### Phase 2 Complete When:
- [ ] All integration tests pass
- [ ] Load tests show acceptable performance
- [ ] No critical bugs in production features

### Phase 3 Complete When:
- [ ] Offline queue fully functional
- [ ] Near-duplicate detection soft-launched
- [ ] Operational tools in place
- [ ] Documentation complete

---

## 🎯 **Quick Start Commands**

```powershell
# 1. Start services
docker-compose -f infra/compose/docker-compose.dev.yml up -d

# 2. Create new migration
cd apps/api
pnpm prisma migrate dev --name pgvector_partitioning

# 3. Test search
cd apps/web
pnpm dev

# 4. Check database
cd apps/api
pnpm db:studio
```

---

**Next Review**: After Phase 1 completion

