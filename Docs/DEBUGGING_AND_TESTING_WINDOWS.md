# Debugging and Testing Guide - Windows

This guide covers debugging and testing the Memory Connector application on Windows.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Running the Application](#running-the-application)
4. [Debugging Backend (NestJS)](#debugging-backend-nestjs)
5. [Debugging Frontend (React)](#debugging-frontend-react)
6. [Database Debugging](#database-debugging)
7. [Common Issues and Solutions](#common-issues-and-solutions)
8. [Testing Procedures](#testing-procedures)
9. [Performance Debugging](#performance-debugging)

---

## Quick Health Check

Run this command to verify your setup:

```powershell
pnpm check:windows
```

This will check:
- Node.js and pnpm installation
- Docker and Docker Compose
- Required dependencies
- Environment files
- Running containers
- Port availability

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **pnpm** (v8 or higher)
   ```powershell
   npm install -g pnpm
   corepack enable
   pnpm --version
   ```

3. **Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop
   - Ensure WSL 2 backend is enabled
   - Verify: `docker --version` and `docker-compose --version`

4. **Git for Windows**
   - Download from: https://git-scm.com/download/win
   - Verify: `git --version`

5. **Visual Studio Code** (Recommended)
   - Download from: https://code.visualstudio.com/
   - Recommended extensions:
     - ESLint
     - Prettier
     - Prisma
     - Docker
     - REST Client

6. **PostgreSQL Client** (Optional but helpful)
   - pgAdmin: https://www.pgadmin.org/
   - Or use VS Code extension: PostgreSQL

---

## Initial Setup

### 1. Clone and Install

```powershell
# Clone repository (if not already done)
git clone <repository-url>
cd "Memory Connector"

# Install dependencies
pnpm install
```

### 2. Configure Environment Variables

```powershell
# Copy example env files
Copy-Item .env.example .env
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env
```

Edit `apps/api/.env`:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/memory_connector
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-secret-key-min-32-chars-change-this
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars-change-this
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
PORT=4000
LOG_LEVEL=debug
```

### 3. Start Docker Services

```powershell
# Start PostgreSQL and Redis
pnpm db:up

# Verify containers are running
docker ps

# Check logs if needed
docker logs memory-connector-postgres
docker logs memory-connector-redis
```

### 4. Database Setup

```powershell
# Navigate to API directory
cd apps\api

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed
```

**Expected Output:**
```
Seeding database...
Seeding completed!
Test user: test@example.com / password123
Created 3 test memories
```

---

## Running the Application

### Option 1: Separate Terminals (Recommended for Debugging)

**Terminal 1 - Backend API:**
```powershell
cd apps\api
pnpm dev
```

**Terminal 2 - Frontend:**
```powershell
cd apps\web
pnpm dev
```

**Terminal 3 - Worker (if needed):**
```powershell
cd apps\worker
pnpm dev
```

### Option 2: Docker Compose (All Services)

```powershell
# From root directory
pnpm compose:up
```

This starts all services with hot reload.

---

## Debugging Backend (NestJS)

### Visual Studio Code Debugging

1. **Create Launch Configuration**

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS API",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "@memory-connector/api", "dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"],
      "env": {
        "NODE_ENV": "development"
      },
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/apps/api/dist/**/*.js"]
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to NestJS",
      "port": 9229,
      "restart": true,
      "localRoot": "${workspaceFolder}/apps/api",
      "remoteRoot": "/app"
    }
  ]
}
```

2. **Set Breakpoints**

- Open any `.ts` file in `apps/api/src`
- Click in the gutter to set breakpoints
- Press F5 to start debugging

3. **Debug Console**

- Use VS Code Debug Console to evaluate expressions
- Check variables in the Variables panel
- View call stack in the Call Stack panel

### Command Line Debugging

```powershell
# Run with Node inspector
cd apps\api
node --inspect-brk -r ts-node/register node_modules/.bin/nest start

# Or use pnpm with inspect
pnpm dev -- --inspect-brk
```

Then attach Chrome DevTools:
- Open `chrome://inspect` in Chrome
- Click "Open dedicated DevTools for Node"

### Logging

The application uses Pino for structured logging. Logs are colorized in development:

```typescript
// In any service
import { logger } from '../common/logger';

logger.info({ userId, memoryId }, 'Memory created');
logger.error({ error, userId }, 'Failed to create memory');
logger.debug({ query, results }, 'Search completed');
```

**View Logs:**
- Console output (development)
- Check `apps/api/logs/` if file logging is configured

### Common Debugging Scenarios

#### 1. API Not Starting

```powershell
# Check if port 4000 is in use
netstat -ano | findstr :4000

# Kill process if needed (replace PID)
taskkill /PID <process-id> /F

# Check for TypeScript errors
cd apps\api
pnpm typecheck
```

#### 2. Database Connection Issues

```powershell
# Test PostgreSQL connection
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "SELECT 1;"

# Check if extensions are installed
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pg_cron');"

# View database logs
docker logs memory-connector-postgres --tail 50
```

#### 3. Prisma Issues

```powershell
# Regenerate Prisma client
cd apps\api
pnpm db:generate

# Check migration status
pnpm prisma migrate status

# Open Prisma Studio (GUI)
pnpm db:studio
```

#### 4. Redis Connection Issues

```powershell
# Test Redis connection
docker exec -it memory-connector-redis redis-cli ping

# Check Redis keys
docker exec -it memory-connector-redis redis-cli KEYS "*"

# Monitor Redis commands
docker exec -it memory-connector-redis redis-cli MONITOR
```

---

## Debugging Frontend (React)

### Visual Studio Code Debugging

1. **Install Debugger for Chrome Extension**

2. **Create Launch Configuration**

Add to `.vscode/launch.json`:
```json
{
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug React App",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/apps/web/src",
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
```

3. **Start Dev Server and Debug**

- Start frontend: `cd apps\web && pnpm dev`
- Press F5 in VS Code
- Set breakpoints in `.tsx` files
- Refresh browser to hit breakpoints

### Browser DevTools

1. **Open Chrome DevTools**
   - Press F12 or Right-click → Inspect
   - Use Console, Network, Application tabs

2. **React DevTools**
   - Install Chrome extension: React Developer Tools
   - View component tree, props, state, hooks

3. **Network Tab**
   - Monitor API calls
   - Check request/response headers
   - Verify idempotency keys

### Common Frontend Issues

#### 1. Build Errors

```powershell
# Clear cache and rebuild
cd apps\web
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force dist
pnpm install
pnpm build
```

#### 2. Hot Reload Not Working

```powershell
# Restart dev server
# Check Vite config: apps/web/vite.config.ts
# Ensure port 5173 is not blocked by firewall
```

#### 3. API Calls Failing

- Check browser console for errors
- Verify CORS settings in `apps/api/src/main.ts`
- Check Network tab for request details
- Verify access token in localStorage:
  ```javascript
  // In browser console
  localStorage.getItem('accessToken')
  ```

#### 4. IndexedDB Issues

```javascript
// In browser console
// Check IndexedDB
indexedDB.databases().then(dbs => console.log(dbs))

// Clear IndexedDB
indexedDB.deleteDatabase('memory-connector')
```

---

## Database Debugging

### Using pgAdmin

1. **Connect to Database**
   - Host: `localhost`
   - Port: `5432`
   - Database: `memory_connector`
   - Username: `postgres`
   - Password: `postgres`

2. **Run Queries**
   ```sql
   -- Check user usage
   SELECT * FROM user_usage;
   
   -- Check memories
   SELECT * FROM memories LIMIT 10;
   
   -- Check embeddings
   SELECT COUNT(*) FROM embeddings;
   
   -- Check idempotency keys
   SELECT * FROM idempotency_keys ORDER BY created_at DESC LIMIT 10;
   ```

### Using VS Code SQL Extension

1. Install "PostgreSQL" extension
2. Connect to `postgresql://postgres:postgres@localhost:5432/memory_connector`
3. Run queries directly in VS Code

### Using psql (Command Line)

```powershell
# Connect via Docker
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector

# Or if psql is installed locally
psql -h localhost -U postgres -d memory_connector
```

**Useful Queries:**

```sql
-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Test vector search function
SELECT * FROM search_similar_embeddings(
  'user-uuid-here'::uuid,
  '[0.1,0.2,...]'::vector(1536),
  20
);

-- Check full-text search
SELECT * FROM memories 
WHERE text_search_vector @@ to_tsquery('english', 'test');

-- View recent AI costs
SELECT * FROM ai_cost_tracking 
ORDER BY created_at DESC 
LIMIT 20;

-- Check circuit breaker state (via Redis)
-- Use: docker exec -it memory-connector-redis redis-cli GET ai:circuit:status
```

---

## Common Issues and Solutions

### Issue 1: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :4000

# Kill process (replace PID)
taskkill /PID <process-id> /F

# Or change port in .env
PORT=4001
```

### Issue 2: Docker WSL 2 Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
1. Open Docker Desktop
2. Go to Settings → General
3. Ensure "Use the WSL 2 based engine" is checked
4. Restart Docker Desktop

### Issue 3: Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```powershell
cd apps\api
pnpm db:generate
pnpm install
```

### Issue 4: pgvector Extension Not Found

**Error:** `extension "vector" does not exist`

**Solution:**
```powershell
# Check if extension is installed
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Verify
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "SELECT extname FROM pg_extension WHERE extname = 'vector';"
```

### Issue 5: Path Issues on Windows

**Error:** Path separators or case sensitivity issues

**Solution:**
- Use forward slashes in imports: `import { X } from '../module'`
- Ensure file names match exactly (Windows is case-insensitive but Git is case-sensitive)

### Issue 6: Line Ending Issues

**Error:** Git warnings about CRLF/LF

**Solution:**
```powershell
# Configure Git for Windows
git config --global core.autocrlf true

# Or use .gitattributes (already in repo)
```

### Issue 7: Permission Denied Errors

**Error:** `EACCES: permission denied`

**Solution:**
```powershell
# Run PowerShell as Administrator
# Or fix permissions:
icacls "path\to\file" /grant Users:F
```

### Issue 8: Redis Connection Refused

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
```powershell
# Check if Redis container is running
docker ps | findstr redis

# Restart if needed
docker restart memory-connector-redis

# Test connection
docker exec -it memory-connector-redis redis-cli ping
```

---

## Testing Procedures

### Unit Tests

```powershell
# Backend tests
cd apps\api
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# Frontend tests
cd apps\web
pnpm test

# Watch mode
pnpm test:watch
```

### Integration Tests

```powershell
# E2E tests (requires services running)
cd apps\api
pnpm test:e2e

# Frontend E2E (Playwright)
cd apps\web
pnpm test:e2e
```

### Manual Testing Checklist

#### Authentication Flow
- [ ] Sign up with new email
- [ ] Login with credentials
- [ ] Refresh token works (wait 15+ minutes, make API call)
- [ ] Logout clears session

#### Memory Creation
- [ ] Create memory with text
- [ ] Create memory with idempotency key
- [ ] Retry same request (should get replayed response)
- [ ] Create duplicate content (should get 409)
- [ ] Hit tier limit (create 11 memories as free user, should get 429)

#### Search
- [ ] Semantic search works
- [ ] Keyword fallback works (break semantic search temporarily)
- [ ] Degraded banner shows when keyword search used

#### Reminders
- [ ] View inbox
- [ ] Mark reminder as read
- [ ] Dismiss reminder

#### Offline Support
- [ ] Disable network in DevTools
- [ ] Create memory (should queue)
- [ ] See offline toast
- [ ] Re-enable network
- [ ] Memory should sync automatically

### API Testing with REST Client

Create `test.http` file in `apps/api`:

```http
### Health Check
GET http://localhost:4000/api/v1/health

### Signup
POST http://localhost:4000/api/v1/auth/signup
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

### Login
POST http://localhost:4000/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

### Create Memory (replace token)
POST http://localhost:4000/api/v1/memories
Authorization: Bearer <your-token>
Content-Type: application/json
Idempotency-Key: test-key-123

{
  "textContent": "Test memory"
}

### Search
GET http://localhost:4000/api/v1/search?q=test
Authorization: Bearer <your-token>

### Get Reminders
GET http://localhost:4000/api/v1/reminders/inbox
Authorization: Bearer <your-token>
```

Use REST Client extension in VS Code to run these requests.

---

## Performance Debugging

### Backend Performance

1. **Enable Request Logging**
   - Already enabled via `LoggingInterceptor`
   - Check console for request duration

2. **Database Query Performance**
   ```sql
   -- Enable query logging in Prisma
   -- Set in PrismaService: log: ['query', 'error', 'warn']
   
   -- Check slow queries
   SELECT pid, now() - query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
   ORDER BY duration DESC;
   ```

3. **Redis Performance**
   ```powershell
   # Monitor Redis commands
   docker exec -it memory-connector-redis redis-cli MONITOR
   
   # Check memory usage
   docker exec -it memory-connector-redis redis-cli INFO memory
   ```

### Frontend Performance

1. **React DevTools Profiler**
   - Install React DevTools
   - Use Profiler tab to identify slow renders

2. **Chrome Performance Tab**
   - Record performance
   - Identify bottlenecks
   - Check bundle size

3. **Network Tab**
   - Check API response times
   - Identify slow requests
   - Check for unnecessary requests

---

## Debugging Tips

### 1. Use Console Logging Strategically

```typescript
// Backend
logger.debug({ userId, memoryId }, 'Processing memory');

// Frontend
console.log('[DEBUG]', { data, state });
```

### 2. Check Environment Variables

```powershell
# Verify env vars are loaded
cd apps\api
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### 3. Use TypeScript Strict Mode

- Already enabled in `tsconfig.json`
- Fix type errors before runtime

### 4. Database State Inspection

```sql
-- Check current state
SELECT COUNT(*) FROM memories;
SELECT COUNT(*) FROM user_usage;
SELECT COUNT(*) FROM idempotency_keys;

-- Check recent activity
SELECT * FROM memories ORDER BY created_at DESC LIMIT 10;
```

### 5. Redis State Inspection

```powershell
# List all keys
docker exec -it memory-connector-redis redis-cli KEYS "*"

# Get specific key
docker exec -it memory-connector-redis redis-cli GET ai:circuit:status

# Check queue length
docker exec -it memory-connector-redis redis-cli LLEN enrichment:queue
```

### 6. Network Debugging

- Use Postman or REST Client for API testing
- Check browser Network tab for frontend requests
- Verify CORS headers
- Check authentication headers

---

## Quick Reference Commands

```powershell
# Start services
pnpm db:up                    # Start DB and Redis
pnpm db:down                  # Stop DB and Redis
pnpm db:migrate              # Run migrations
pnpm db:seed                 # Seed database
pnpm dev                     # Start all dev servers

# Backend
cd apps\api
pnpm dev                     # Start API
pnpm db:generate             # Generate Prisma client
pnpm db:studio               # Open Prisma Studio
pnpm test                    # Run tests
pnpm typecheck               # Type check

# Frontend
cd apps\web
pnpm dev                     # Start dev server
pnpm build                   # Build for production
pnpm test                    # Run tests
pnpm typecheck               # Type check

# Docker
docker ps                    # List running containers
docker logs <container>      # View logs
docker exec -it <container> <command>  # Execute command
docker-compose logs -f       # Follow logs
```

---

## Getting Help

1. **Run Health Check**
   ```powershell
   pnpm check:windows
   ```
   This will identify common setup issues.

2. **Check Logs**
   - Backend: Console output or `apps/api/logs/`
   - Frontend: Browser console
   - Docker: `docker logs <container>`

3. **Verify Setup**
   - Run `pnpm typecheck` in both apps
   - Check environment variables
   - Verify Docker containers are running

4. **Reset Environment** (if needed)
   ```powershell
   pnpm reset:windows
   ```
   This will clean node_modules, build artifacts, and stop containers.

5. **Common Solutions**
   - Restart Docker Desktop
   - Clear node_modules and reinstall: `pnpm reset:windows && pnpm install`
   - Regenerate Prisma client: `cd apps/api && pnpm db:generate`
   - Check port availability: `netstat -ano | findstr :4000`

6. **Documentation**
   - See `docs/architecture.md` for system overview
   - See `docs/api.md` for API reference
   - See `SMOKE_TESTS.md` for verification steps
   - See `docs/WINDOWS_QUICK_START.md` for quick reference

---

## Next Steps

After debugging:

1. Run smoke tests: See `SMOKE_TESTS.md`
2. Review architecture: See `docs/architecture.md`
3. Check runbooks: See `docs/runbooks.md` for operational procedures

