# Memory Connector - Implementation Planning Guide

> **Purpose**: Comprehensive planning document for MVP implementation, including required extensions, dependencies, and phased rollout strategy

---

## 1. Required Database Extensions

### 1.1 PostgreSQL Extensions

#### **pgvector** (Required)
- **Purpose**: Vector similarity search for semantic memory search
- **Installation**:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- **Where Used**: 
  - Section 5: pgvector Indexing & Partitioning
  - Section 4: Keyword Search Fallback (semantic search)
  - Section 10: Near-Duplicate Detection
- **PostgreSQL Version**: Requires PostgreSQL 11+ (recommended: 14+)
- **Installation Method**:
  - **Local Development**: `sudo apt-get install postgresql-14-pgvector` (Ubuntu/Debian)
  - **Docker**: Use `pgvector/pgvector:pg14` image
  - **Cloud (AWS RDS)**: Enable via parameter group (PostgreSQL 14+)
  - **Cloud (Azure)**: Available in Azure Database for PostgreSQL
  - **Cloud (GCP)**: Available in Cloud SQL for PostgreSQL

#### **pg_cron** (Required)
- **Purpose**: Scheduled jobs for maintenance tasks
- **Installation**:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  ```
- **Where Used**:
  - Section 2: AI Cost Guardrails (refresh materialized view every minute)
  - Section 3: Idempotency (cleanup expired keys hourly)
- **PostgreSQL Version**: Requires PostgreSQL 11+
- **Installation Method**:
  - **Local Development**: `sudo apt-get install postgresql-14-cron` (Ubuntu/Debian)
  - **Docker**: Add to custom image or use pre-built image
  - **Cloud (AWS RDS)**: Not directly supported - use AWS EventBridge + Lambda instead
  - **Cloud (Azure)**: Not directly supported - use Azure Functions instead
  - **Cloud (GCP)**: Not directly supported - use Cloud Scheduler + Cloud Functions instead
- **⚠️ Cloud Alternative**: For cloud deployments, replace pg_cron with:
  - AWS: EventBridge scheduled rules + Lambda functions
  - Azure: Timer-triggered Azure Functions
  - GCP: Cloud Scheduler + Cloud Functions

### 1.2 Extension Installation Checklist

```bash
# PostgreSQL Extensions Installation
# ===================================

# 1. Connect to PostgreSQL
psql -U postgres -d memory_connector

# 2. Install pgvector
CREATE EXTENSION IF NOT EXISTS vector;

# 3. Install pg_cron (if supported, otherwise use cloud alternative)
CREATE EXTENSION IF NOT EXISTS pg_cron;

# 4. Verify installations
SELECT * FROM pg_extension WHERE extname IN ('vector', 'pg_cron');
```

---

## 2. Infrastructure Requirements

### 2.1 Core Services

| Service | Purpose | Required | Alternatives |
|---------|---------|----------|--------------|
| **PostgreSQL 14+** | Primary database | ✅ Yes | - |
| **Redis** | Circuit breaker state, caching | ✅ Yes | Memcached (limited) |
| **AWS SQS** | Enrichment queue | ✅ Yes | RabbitMQ, Azure Service Bus, GCP Pub/Sub |
| **OpenAI API** | Embeddings & classification | ✅ Yes | Cohere, Hugging Face (requires model hosting) |
| **Slack API** | Alerting | ⚠️ Optional | Email, PagerDuty, Opsgenie |
| **LaunchDarkly** | Feature flags | ⚠️ Optional | ConfigCat, Unleash, self-hosted |

### 2.2 Client-Side Requirements

| Technology | Purpose | Required |
|------------|---------|----------|
| **IndexedDB** | Offline queue, drafts | ✅ Yes (Browser API) |
| **Storage API** | Quota detection | ✅ Yes (Browser API) |
| **Service Worker** | Offline support | ⚠️ Recommended |

---

## 3. NPM Dependencies

### 3.1 Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0",
    "ioredis": "^5.3.0",
    "openai": "^4.0.0",
    "aws-sdk": "^2.1500.0",
    "@slack/web-api": "^6.9.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 3.2 Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "idb": "^8.0.0",
    "lucide-react": "^0.294.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Core infrastructure and database setup

**Tasks**:
- [ ] Set up PostgreSQL database with pgvector extension
- [ ] Set up Redis instance
- [ ] Configure AWS SQS queue
- [ ] Create database schema (users, memories, embeddings)
- [ ] Implement basic memory CRUD endpoints
- [ ] Set up development environment

**Deliverables**:
- Database migrations (001-006)
- Basic API endpoints
- Development environment documentation

**Dependencies**:
- PostgreSQL 14+ with pgvector
- Redis instance
- AWS account (for SQS)

---

### Phase 2: Core Features (Weeks 3-4)
**Goal**: Tier limits, idempotency, and basic search

**Tasks**:
- [ ] Implement tier limits system (Section 1)
- [ ] Implement idempotency middleware (Section 3)
- [ ] Implement content-based duplicate detection (Section 3)
- [ ] Set up pgvector partitions and indexes (Section 5)
- [ ] Implement basic semantic search (Section 4)
- [ ] Implement keyword search fallback (Section 4)

**Deliverables**:
- Usage limit enforcement
- Duplicate save protection
- Working search (semantic + keyword fallback)

**Dependencies**:
- Phase 1 complete
- OpenAI API key
- pgvector extension installed

---

### Phase 3: AI & Cost Management (Weeks 5-6)
**Goal**: AI cost guardrails and enrichment queue

**Tasks**:
- [ ] Implement AI cost tracking (Section 2)
- [ ] Implement circuit breaker (Section 2)
- [ ] Set up enrichment queue (Section 2)
- [ ] Implement alerting system (Section 2)
- [ ] Create admin dashboard for cost monitoring

**Deliverables**:
- Circuit breaker system
- Cost tracking and alerts
- Enrichment queue processing

**Dependencies**:
- Phase 2 complete
- Slack integration (optional)
- Monitoring setup

---

### Phase 4: Offline & Sync (Weeks 7-8)
**Goal**: Offline support and conflict resolution

**Tasks**:
- [ ] Implement IndexedDB offline queue (Section 9)
- [ ] Implement sync service
- [ ] Create conflict resolution UI (Section 7)
- [ ] Implement storage quota detection (Section 9)
- [ ] Device testing (Section 9)

**Deliverables**:
- Offline save capability
- Conflict resolution UI
- Storage management

**Dependencies**:
- Phase 3 complete
- Test devices available

---

### Phase 5: Reminders & Polish (Weeks 9-10)
**Goal**: Reminder inbox and near-duplicate detection

**Tasks**:
- [ ] Implement reminder inbox (Section 6)
- [ ] Implement near-duplicate detection (Section 10)
- [ ] Create operational runbooks (Section 8)
- [ ] Performance testing and optimization
- [ ] Documentation completion

**Deliverables**:
- Reminder inbox UI
- Near-duplicate detection (soft launch)
- Operational documentation

**Dependencies**:
- Phase 4 complete
- Feature flag system (LaunchDarkly or alternative)

---

## 5. Cloud Deployment Considerations

### 5.1 AWS RDS PostgreSQL

**pgvector Installation**:
1. Create custom parameter group
2. Enable `shared_preload_libraries` to include pgvector
3. Restart RDS instance
4. Connect and run: `CREATE EXTENSION vector;`

**pg_cron Alternative**:
- Use AWS EventBridge scheduled rules
- Trigger Lambda functions for:
  - Materialized view refresh
  - Idempotency key cleanup

### 5.2 Azure Database for PostgreSQL

**pgvector**: Pre-installed in Flexible Server
**pg_cron Alternative**: Use Azure Functions with Timer trigger

### 5.3 Google Cloud SQL

**pgvector**: Available via `cloudsql.enable_pgvector` flag
**pg_cron Alternative**: Use Cloud Scheduler + Cloud Functions

---

## 6. Development Environment Setup

### 6.1 Local Development Stack

```bash
# 1. Install PostgreSQL with extensions
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-14 postgresql-14-pgvector postgresql-14-cron

# macOS (Homebrew)
brew install postgresql@14
brew install pgvector

# 2. Install Redis
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# 3. Start services
sudo systemctl start postgresql
sudo systemctl start redis

# 4. Create database
createdb memory_connector

# 5. Install extensions
psql memory_connector -c "CREATE EXTENSION vector;"
psql memory_connector -c "CREATE EXTENSION pg_cron;"
```

### 6.2 Docker Compose Setup

```yaml
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg14
    environment:
      POSTGRES_DB: memory_connector
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 7. Migration Strategy

### 7.1 Database Migrations Order

1. **001_user_usage.sql**: User usage tracking tables
2. **002_ai_cost_tracking.sql**: AI cost tracking tables
3. **003_idempotency_keys.sql**: Idempotency tables
4. **004_full_text_search.sql**: Full-text search setup
5. **005_embeddings_partitions.sql**: pgvector partitions (requires extension)
6. **006_reminder_inbox.sql**: Reminder inbox columns

### 7.2 Extension Installation Timing

- **Before Migration 005**: pgvector must be installed
- **Before Migration 002**: pg_cron (or cloud alternative) for materialized view refresh

---

## 8. Testing Requirements

### 8.1 Load Testing

- pgvector search performance (Section 5.4)
- Queue processing throughput
- Database connection pooling

### 8.2 Device Testing

- IndexedDB on low-storage devices (Section 9)
- Offline queue behavior
- Storage quota handling

### 8.3 Integration Testing

- OpenAI API integration
- SQS queue processing
- Redis circuit breaker

---

## 9. Risk Mitigation

### 9.1 Extension Availability

**Risk**: pg_cron not available in cloud environments
**Mitigation**: 
- Design cloud-agnostic scheduled job system
- Use cloud-native alternatives (EventBridge, Functions)

### 9.2 pgvector Performance

**Risk**: Search latency degrades with scale
**Mitigation**:
- Partition strategy (Section 5.1)
- HNSW index tuning
- Keyword search fallback (Section 4)

### 9.3 Cost Overruns

**Risk**: AI costs exceed budget
**Mitigation**:
- Circuit breaker (Section 2)
- Per-user limits
- Queue-based processing

---

## 10. Quick Start Checklist

- [ ] PostgreSQL 14+ installed with pgvector extension
- [ ] Redis instance running
- [ ] AWS SQS queue created
- [ ] OpenAI API key obtained
- [ ] Database created and extensions installed
- [ ] Environment variables configured
- [ ] NPM dependencies installed
- [ ] Development environment tested
- [ ] First migration run successfully

---

## 11. Estimated Timeline

| Phase | Duration | Team Size | Complexity |
|-------|----------|-----------|------------|
| Phase 1: Foundation | 2 weeks | 2-3 devs | Medium |
| Phase 2: Core Features | 2 weeks | 2-3 devs | High |
| Phase 3: AI & Cost | 2 weeks | 2-3 devs | High |
| Phase 4: Offline & Sync | 2 weeks | 2-3 devs | High |
| Phase 5: Reminders & Polish | 2 weeks | 2-3 devs | Medium |
| **Total** | **10 weeks** | **2-3 devs** | **High** |

**Buffer**: Add 2-3 weeks for testing, bug fixes, and unexpected issues

---

## 12. Next Steps

1. **Review and approve** this planning document
2. **Set up development environment** (Section 6)
3. **Create project repository** with initial structure
4. **Set up CI/CD pipeline**
5. **Begin Phase 1** implementation

---

## Appendix: Extension Installation Commands by Platform

### Local Development (Ubuntu/Debian)
```bash
sudo apt-get install postgresql-14-pgvector postgresql-14-cron
```

### Local Development (macOS)
```bash
brew install pgvector
# Note: pg_cron may require manual compilation
```

### Docker
```dockerfile
FROM pgvector/pgvector:pg14
# pgvector pre-installed
```

### AWS RDS
- Use custom parameter group
- Enable via AWS Console or CLI
- Restart instance after enabling

### Azure Database for PostgreSQL
- pgvector: Pre-installed in Flexible Server
- pg_cron: Not available, use Azure Functions

### Google Cloud SQL
- Enable via `cloudsql.enable_pgvector` flag
- pg_cron: Not available, use Cloud Scheduler

