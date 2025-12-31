# Memory Connector - Technology Stack

> **Last Updated:** December 2024  
> **Version:** 1.0.0-MVP

---

## Overview

Memory Connector is built as a modern, full-stack TypeScript application using a monorepo architecture. The stack is optimized for performance, developer experience, and cost-effective AI integration.

---

## 🎯 Core Technology Stack

### **Backend API**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **TypeScript** | 5.3+ | Type-safe development |
| **NestJS** | 10.3+ | Enterprise-grade Node.js framework |
| **Prisma** | 5.8+ | Type-safe ORM and database toolkit |
| **PostgreSQL** | 16+ | Primary relational database |
| **pgvector** | Latest | Vector similarity search extension |
| **Redis** | 7+ | Caching, session storage, circuit breaker state |
| **OpenAI API** | 4.20+ | AI embeddings and classification |

### **Frontend Web Application**

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI framework |
| **TypeScript** | 5.3+ | Type safety |
| **Vite** | 5.0+ | Build tool and dev server |
| **React Router** | 6.21+ | Client-side routing |
| **TanStack Query** | 5.17+ | Server state management |
| **Tailwind CSS** | 3.4+ | Utility-first CSS framework |
| **IndexedDB (idb)** | 8.0+ | Offline storage and queue |

### **Infrastructure & DevOps**

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local development orchestration |
| **pnpm** | Fast, disk-efficient package manager |
| **Monorepo** | Single repository for apps and packages |

---

## 📦 Key Dependencies

### Backend Dependencies

```json
{
  "@nestjs/common": "^10.3.0",        // Core NestJS framework
  "@nestjs/jwt": "^10.2.0",            // JWT authentication
  "@nestjs/swagger": "^7.1.17",        // API documentation
  "@nestjs/throttler": "^5.1.1",       // Rate limiting
  "@prisma/client": "^5.8.1",          // Prisma ORM client
  "argon2": "^0.44.0",                 // Password hashing
  "ioredis": "^5.3.2",                 // Redis client
  "openai": "^4.20.1",                 // OpenAI SDK
  "pino": "^8.17.2",                   // Structured logging
  "helmet": "^7.1.0",                  // Security headers
  "class-validator": "^0.14.0",        // DTO validation
  "cookie-parser": "^1.4.6"            // Cookie parsing
}
```

### Frontend Dependencies

```json
{
  "react": "^18.2.0",                   // UI library
  "react-dom": "^18.2.0",               // React DOM renderer
  "react-router-dom": "^6.21.0",        // Routing
  "@tanstack/react-query": "^5.17.0",   // Data fetching
  "react-hook-form": "^7.49.2",         // Form management
  "zod": "^3.22.4",                     // Schema validation
  "date-fns": "^3.0.0",                 // Date utilities
  "lucide-react": "^0.309.0",           // Icon library
  "idb": "^8.0.0",                      // IndexedDB wrapper
  "tailwindcss": "^3.4.0"               // CSS framework
}
```

---

## 🏗️ Architecture Patterns

### **Monorepo Structure**

```
memory-connector/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # React frontend
├── packages/
│   ├── shared/       # Shared types and schemas
│   └── eslint-config/ # Shared linting config
└── infra/            # Docker compose files
```

### **Backend Architecture (NestJS)**

- **Modular Design**: Feature-based modules (Auth, Memories, Search, etc.)
- **Dependency Injection**: Built-in DI container
- **Guards**: Authentication, authorization, rate limiting
- **Interceptors**: Idempotency, logging, error handling
- **Pipes**: Validation and transformation
- **Filters**: Global exception handling

### **Frontend Architecture (React)**

- **Component-Based**: Reusable UI components
- **Context API**: Global state (auth, offline sync)
- **Custom Hooks**: Business logic abstraction
- **Code Splitting**: Route-based lazy loading
- **Offline-First**: IndexedDB queue with auto-sync

---

## 🗄️ Database Architecture

### **PostgreSQL Features**

- **pgvector Extension**: Vector similarity search (HNSW indexes)
- **Full-Text Search**: GIN indexes on tsvector columns
- **Partitioning**: 16 partitions for embeddings table
- **JSONB Support**: Flexible memory metadata storage

### **Redis Usage**

- **Session Storage**: Refresh token management
- **Circuit Breaker State**: AI cost tracking
- **Rate Limiting**: Token bucket algorithm
- **Cache**: Frequently accessed data

---

## 🔐 Security Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Authentication** | JWT (access) + httpOnly cookies (refresh) | Secure token management |
| **Password Hashing** | Argon2 | Industry-standard hashing |
| **Rate Limiting** | NestJS Throttler | DDoS protection |
| **Security Headers** | Helmet.js | XSS, CSRF protection |
| **CORS** | NestJS CORS | Cross-origin security |
| **Input Validation** | class-validator + Zod | Prevent injection attacks |

---

## 🤖 AI Integration

### **OpenAI Services**

- **Embeddings**: `text-embedding-ada-002` (1536 dimensions)
- **Classification**: GPT-3.5-turbo for content categorization
- **Cost Tracking**: Per-operation cost monitoring
- **Circuit Breaker**: Automatic budget protection

### **Vector Search**

- **Algorithm**: Cosine similarity via pgvector
- **Index Type**: HNSW (Hierarchical Navigable Small World)
- **Partitioning**: 16 partitions for scalability
- **Fallback**: Keyword search (PostgreSQL FTS)

---

## 🧪 Testing Stack

| Layer | Framework | Purpose |
|-------|-----------|---------|
| **Backend Unit** | Jest | Service and controller tests |
| **Backend E2E** | Jest + Supertest | API integration tests |
| **Frontend Unit** | Vitest | Component and hook tests |
| **Frontend E2E** | Playwright | Browser automation tests |
| **Type Checking** | TypeScript | Compile-time type safety |

---

## 📊 Monitoring & Observability

- **Logging**: Pino (structured JSON logs)
- **Health Checks**: `/api/v1/health` endpoint
- **Metrics**: Prometheus endpoint (placeholder)
- **Error Tracking**: Structured error logging
- **Cost Alerts**: Slack integration for AI budget

---

## 🚀 Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting with TypeScript rules |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **lint-staged** | Pre-commit linting |
| **Prisma Studio** | Database GUI |
| **Swagger UI** | API documentation browser |

---

## 📦 Package Management

- **pnpm**: Fast, efficient package manager
- **Workspaces**: Monorepo workspace support
- **Lock File**: `pnpm-lock.yaml` for reproducible installs

---

## 🌐 Deployment Targets

### **Development**
- Docker Compose for local services
- Hot reload for both frontend and backend
- Volume mounts for live code updates

### **Production** (Planned)
- Containerized deployment
- Multi-stage Docker builds
- Environment-based configuration
- Health check endpoints

---

## 🔄 Data Flow

### **Memory Creation**
```
React → NestJS → Prisma → PostgreSQL
                ↓
            Redis (cache)
                ↓
            OpenAI API
```

### **Search Flow**
```
React → NestJS → pgvector (semantic)
                ↓ (fallback)
            PostgreSQL FTS (keyword)
```

### **Offline Sync**
```
React → IndexedDB → Background Sync → NestJS → PostgreSQL
```

---

## 📈 Performance Optimizations

1. **Database**
   - Partitioned embeddings table (16 partitions)
   - HNSW indexes for fast vector search
   - GIN indexes for full-text search
   - Connection pooling via Prisma

2. **Frontend**
   - Code splitting and lazy loading
   - React Query caching
   - IndexedDB for offline storage
   - Optimistic updates

3. **API**
   - Redis caching for frequently accessed data
   - Rate limiting to prevent abuse
   - Circuit breaker for AI cost control
   - Idempotency for safe retries

---

## 🔮 Future Considerations

- **GraphQL**: Alternative to REST API
- **WebSockets**: Real-time updates
- **Service Workers**: Enhanced offline support
- **CDN**: Static asset delivery
- **Load Balancing**: Horizontal scaling
- **Message Queue**: SQS/RabbitMQ for async processing

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

**Last Updated:** December 2024



