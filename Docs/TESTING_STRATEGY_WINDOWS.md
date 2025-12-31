# 100% Testing Strategy - Windows Guide

**Platform**: Windows 10/11
**Goal**: Verify all features work before deployment
**Time Required**: 30-45 minutes
**Difficulty**: Easy (copy-paste commands)

---

## 🎯 Testing Overview

This guide tests:
- ✅ Backend API (all endpoints)
- ✅ Frontend UI (all pages)
- ✅ Database operations
- ✅ AI enrichment
- ✅ Search functionality
- ✅ Offline sync
- ✅ Authentication
- ✅ Error handling

---

## 📋 Pre-Testing Checklist

Before starting, ensure:
- [ ] Docker Desktop is running
- [ ] No other apps using ports 4000, 5173, 5432, 6379
- [ ] You have an OpenAI API key (for AI enrichment tests)

---

## Step 1: Clean Environment Setup

### 1.1 Stop Any Running Processes

```powershell
# Open PowerShell as Administrator
# Press Win+X, select "Windows PowerShell (Admin)" or "Terminal (Admin)"

# Stop any processes on port 4000 (backend)
$process = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
    Write-Host "✅ Stopped process on port 4000" -ForegroundColor Green
} else {
    Write-Host "✅ Port 4000 is free" -ForegroundColor Green
}

# Stop any processes on port 5173 (frontend)
$process = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
    Write-Host "✅ Stopped process on port 5173" -ForegroundColor Green
} else {
    Write-Host "✅ Port 5173 is free" -ForegroundColor Green
}
```

### 1.2 Stop and Remove Existing Containers

```powershell
# Navigate to project directory
cd "C:\Visual Studio\Memory Connector"

# Stop and remove containers
pnpm db:down

# Wait 5 seconds
Start-Sleep -Seconds 5

# Verify containers are stopped
docker ps -a | Select-String "memory-connector"
# Should show no running containers or empty output
```

### 1.3 Clean Docker Volumes (Fresh Start)

```powershell
# Remove old volumes (clean slate)
docker volume rm memory-connector_postgres-data -ErrorAction SilentlyContinue
docker volume rm memory-connector_redis-data -ErrorAction SilentlyContinue

Write-Host "✅ Cleaned old data" -ForegroundColor Green
```

---

## Step 2: Start Fresh Database

### 2.1 Start Docker Containers

```powershell
# Start PostgreSQL and Redis
pnpm db:up

# Wait for containers to be ready (30 seconds)
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verify containers are running
docker ps
```

**Expected Output**:
```
CONTAINER ID   IMAGE          COMMAND                  PORTS                    NAMES
xxxxxxxxxxxx   postgres:16    "docker-entrypoint..."   0.0.0.0:5432->5432/tcp   memory-connector-postgres
xxxxxxxxxxxx   redis:7        "docker-entrypoint..."   0.0.0.0:6379->6379/tcp   memory-connector-redis
```

### 2.2 Setup Database Schema

```powershell
# Navigate to backend
cd apps\api

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed test data
pnpm db:seed
```

**Expected Output** (from seed):
```
✅ Test user created: test@example.com / password123
✅ Admin user created: admin@example.com / admin123
✅ Sample memories created
✅ Seed data inserted successfully
```

### 2.3 Verify Database Connection

```powershell
# Test PostgreSQL connection
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "SELECT COUNT(*) FROM users;"
```

**Expected Output**:
```
 count
-------
     2
(1 row)
```

### 2.4 Verify pgvector Extension

```powershell
# Check pgvector extension
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "\dx"
```

**Expected Output** (should include):
```
 vector  | 0.5.1  | public | vector data type and ivfflat access method
```

---

## Step 3: Backend Automated Tests

### 3.1 Run Unit Tests

```powershell
# Still in apps\api directory
pnpm test

# Wait for all tests to complete (~2 minutes)
```

**Expected Output**:
```
Test Suites: X passed, X total
Tests:       X passed, X total
Snapshots:   0 total
Time:        X.XXXs
```

**All tests should pass** ✅

### 3.2 Run E2E Tests

```powershell
# Run end-to-end tests
pnpm test:e2e
```

**Expected Output**:
```
 PASS  test/auth.e2e-spec.ts
 PASS  test/memories.e2e-spec.ts
 PASS  test/search.e2e-spec.ts

Test Suites: 3 passed, 3 total
Tests:       XX passed, XX total
```

**All tests should pass** ✅

### 3.3 Check Test Coverage (Optional)

```powershell
# Generate coverage report
pnpm test:cov

# Open coverage report in browser
Start-Process "coverage\lcov-report\index.html"
```

**Expected**: 85%+ coverage on critical modules

---

## Step 4: Start Development Servers

### 4.1 Start Backend API

```powershell
# Open a new PowerShell terminal (Terminal 1)
cd "C:\Visual Studio\Memory Connector\apps\api"

# Set environment variables for testing
$env:OPENAI_API_KEY = "your-openai-api-key-here"
$env:NODE_ENV = "development"

# Start backend
pnpm dev
```

**Expected Output**:
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [RoutesResolver] AuthController {/api/v1/auth}:
[Nest] INFO [RoutesResolver] MemoriesController {/api/v1/memories}:
[Nest] INFO [RoutesResolver] SearchController {/api/v1/search}:
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO Application is running on: http://localhost:4000
```

**🟢 Keep this terminal running**

### 4.2 Test Backend Health Endpoint

```powershell
# Open a new PowerShell terminal (Terminal 2)
# Test health endpoint
curl http://localhost:4000/api/v1/health
```

**Expected Output**:
```json
{"status":"ok","info":{"database":{"status":"up"},"redis":{"status":"up"}},"error":{},"details":{"database":{"status":"up"},"redis":{"status":"up"}}}
```

### 4.3 Start Frontend

```powershell
# In Terminal 2 (or new Terminal 3)
cd "C:\Visual Studio\Memory Connector\apps\web"

# Start frontend
pnpm dev
```

**Expected Output**:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**🟢 Keep this terminal running**

---

## Step 5: Manual Frontend Testing

### 5.1 Open Application in Browser

```powershell
# Open default browser to app
Start-Process "http://localhost:5173"
```

### 5.2 Test Authentication Flow

**Test Login Page**:

1. **Navigate**: Browser should automatically redirect to `/login`
2. **URL Check**: Should be `http://localhost:5173/login`
3. **Visual Check**:
   - ✅ "Sign in to Memory Connector" header visible
   - ✅ Email and password fields visible
   - ✅ "Sign in" button visible
   - ✅ "Don't have an account? Sign up" link visible

**Test Login**:

1. **Enter credentials**:
   - Email: `test@example.com`
   - Password: `password123`

2. **Click "Sign in"**

3. **Expected behavior**:
   - ✅ Button shows "Signing in..." briefly
   - ✅ Redirects to `/app/capture` (Capture page)
   - ✅ No error messages

**Check Browser Console** (Press F12):
- ✅ Should see: `POST http://localhost:4000/api/v1/auth/login` (Status 200)
- ❌ Should NOT see any red errors

### 5.3 Test Memory Capture

**On Capture Page** (`http://localhost:5173/app/capture`):

1. **Visual Check**:
   - ✅ "Capture a Memory" header visible
   - ✅ Text area for memory content
   - ✅ Optional image URL field
   - ✅ "Save Memory" button

2. **Create Test Memory #1**:
   - **Text**: "Attended team meeting about Q1 goals. Need to follow up with Sarah about project timeline."
   - **Image URL**: (leave empty)
   - **Click**: "Save Memory"

3. **Expected behavior**:
   - ✅ Button shows "Saving..." briefly
   - ✅ Success message appears
   - ✅ Redirects to `/app/search` (Search page)
   - ✅ Form clears

4. **Check Backend Terminal** (Terminal 1):
   - ✅ Should see: `POST /api/v1/memories` log
   - ✅ Should see: "Memory created" or similar

5. **Go back to Capture** (click "Capture" in navigation or go to `http://localhost:5173/app/capture`)

6. **Create Test Memory #2**:
   - **Text**: "Had coffee with John. He recommended the book 'Atomic Habits' - should read it next month."
   - **Click**: "Save Memory"

7. **Create Test Memory #3**:
   - **Text**: "Family dinner at Luigi's Italian Restaurant. Kids loved the pizza. Need to book anniversary dinner there."
   - **Click**: "Save Memory"

**Total memories created**: 3 ✅

### 5.4 Test Search Functionality

**On Search Page** (`http://localhost:5173/app/search`):

1. **Visual Check**:
   - ✅ Search input field visible
   - ✅ Filter options (category, date range)
   - ✅ Memory list showing your 3 memories

2. **Test Keyword Search**:
   - **Enter**: "coffee"
   - **Expected**: Should show Memory #2 (coffee with John)
   - ✅ Highlight shows keyword match

3. **Test Semantic Search** (wait 1-2 minutes for AI enrichment):
   - **Enter**: "restaurant recommendations"
   - **Expected**: Should show Memory #3 (Luigi's Restaurant)
   - ✅ Results based on meaning, not just keywords

4. **Test Category Filter**:
   - **Select**: "Personal" category
   - **Expected**: Shows personal memories (coffee, family dinner)

5. **Clear Search**:
   - **Click**: Clear or delete search text
   - **Expected**: All memories visible again

### 5.5 Test Reminders

**Navigate to Reminders** (`http://localhost:5173/app/reminders`):

1. **Visual Check**:
   - ✅ "Reminders" header visible
   - ✅ List of actionable items (if any detected by AI)

2. **Expected Reminders** (after AI enrichment):
   - "Follow up with Sarah about project timeline" (from Memory #1)
   - "Read 'Atomic Habits' next month" (from Memory #2)
   - "Book anniversary dinner at Luigi's" (from Memory #3)

3. **Test Dismiss**:
   - **Click**: Dismiss on one reminder
   - **Expected**: Reminder moves to "Completed" or disappears
   - ✅ Change persists on page refresh

### 5.6 Test Settings

**Navigate to Settings** (`http://localhost:5173/app/settings`):

1. **Visual Check**:
   - ✅ "Settings" header visible
   - ✅ User information displayed
   - ✅ Account settings options

2. **Check Usage Limits** (click "Usage & Limits" if available):
   - ✅ Shows daily memory limit
   - ✅ Shows current usage (3/10 for free tier)

3. **Test Logout**:
   - **Click**: "Logout" button
   - **Expected**: Redirects to `/login`
   - ✅ Cannot access protected routes without login

---

## Step 6: Test Offline Functionality

### 6.1 Prepare for Offline Test

1. **Login again**: `test@example.com` / `password123`
2. **Navigate to Capture**: `http://localhost:5173/app/capture`
3. **Open DevTools**: Press `F12`
4. **Open Network Tab**: Click "Network" tab in DevTools

### 6.2 Go Offline

1. **In Network tab**: Find throttling dropdown (says "No throttling" or "Online")
2. **Select**: "Offline"
3. **Visual Check**: Should see offline indicator (orange/yellow banner at top)

### 6.3 Create Offline Memory

1. **Enter Text**: "This memory was created while offline. Testing sync functionality."
2. **Click**: "Save Memory"
3. **Expected**:
   - ✅ Success message: "Memory saved offline. Will sync when online."
   - ✅ Memory queued (check console for "Queued memory" log)

### 6.4 Check IndexedDB

1. **In DevTools**: Click "Application" tab
2. **Navigate**: Storage > IndexedDB > `memory-connector` > `pending-memories`
3. **Expected**: Should see 1 entry with your offline memory
4. **Check fields**:
   - ✅ `id`: UUID
   - ✅ `textContent`: Your memory text
   - ✅ `queuedAt`: Timestamp
   - ✅ `idempotencyKey`: UUID

### 6.5 Go Back Online and Test Sync

1. **In Network tab**: Change "Offline" back to "No throttling"
2. **Visual Check**: Offline indicator should disappear
3. **Expected** (within 5-10 seconds):
   - ✅ Console shows: "Syncing pending memories..."
   - ✅ Console shows: "Successfully synced memory"
   - ✅ Success toast: "Synced 1 memory"

4. **Check IndexedDB again**:
   - ✅ `pending-memories` should be empty (synced)

5. **Navigate to Search**:
   - ✅ Offline memory now appears in list

---

## Step 7: Test AI Enrichment

### 7.1 Wait for Enrichment Worker

**In Backend Terminal** (Terminal 1), watch for:

```
[EnrichmentWorker] INFO Starting enrichment worker
[EnrichmentWorker] INFO Processing enrichment job (memoryId: xxx)
[EnrichmentService] INFO Enrichment completed for memory xxx
```

**Wait**: 1-3 minutes for all memories to be enriched

### 7.2 Check Enrichment Results

**Method 1: Via API**

```powershell
# In a new PowerShell terminal
# Get auth token first (login)
$loginResponse = curl -X POST http://localhost:4000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123"}' | ConvertFrom-Json

$token = $loginResponse.accessToken

# Get memories with enrichment
curl http://localhost:4000/api/v1/memories `
  -H "Authorization: Bearer $token" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected** (for each memory):
```json
{
  "id": "...",
  "textContent": "...",
  "enrichmentStatus": "enriched",
  "category": "Work" | "Personal" | "Family" | etc.,
  "tags": ["meeting", "follow-up"],
  "sentiment": "neutral" | "positive" | "negative",
  "detectedReminders": [
    {
      "text": "Follow up with Sarah",
      "priority": "medium"
    }
  ]
}
```

**Method 2: Via Prisma Studio**

```powershell
# In apps\api directory
cd "C:\Visual Studio\Memory Connector\apps\api"
pnpm db:studio
```

1. **Opens**: http://localhost:5555
2. **Click**: `Memory` table
3. **Check columns**:
   - ✅ `enrichmentStatus`: Should be "enriched" (not "pending")
   - ✅ `category`: Should have value (e.g., "Work", "Personal")
   - ✅ `tags`: Should be populated
   - ✅ `sentiment`: Should have value

4. **Click**: `Embedding` table
   - ✅ Should see embeddings for each memory
   - ✅ `vector`: Should have 1536-dimension vector

### 7.3 Test Semantic Search (Requires Enrichment)

**Navigate to Search** (`http://localhost:5173/app/search`):

1. **Test Concept-Based Search**:
   - **Enter**: "what tasks do I need to complete"
   - **Expected**: Shows Memory #1 (follow up with Sarah) and #3 (book restaurant)
   - ✅ Results match MEANING, not just keywords

2. **Test Another Concept**:
   - **Enter**: "book recommendations"
   - **Expected**: Shows Memory #2 (Atomic Habits)
   - ✅ Found even though query uses "book" and memory says "book" differently

3. **Check Search Quality Indicator**:
   - ✅ Should NOT show degraded mode banner
   - ✅ Results ordered by relevance

---

## Step 8: Test Error Handling

### 8.1 Test Duplicate Content Detection

1. **Navigate to Capture**: `http://localhost:5173/app/capture`
2. **Enter exact same text as Memory #1**:
   - "Attended team meeting about Q1 goals. Need to follow up with Sarah about project timeline."
3. **Click**: "Save Memory"
4. **Expected**:
   - ❌ Error message: "This memory content already exists"
   - ✅ Memory NOT saved (duplicate prevented)

### 8.2 Test Usage Limits

**Simulate Limit Exceeded** (requires database modification):

```powershell
# Connect to database
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector

# Find your user
SELECT id FROM users WHERE email = 'test@example.com';
# Copy the user ID

# Update usage to be at limit (free tier = 10)
UPDATE user_usage
SET daily_count = 10
WHERE user_id = 'your-user-id-here'
  AND operation = 'MEMORY_CREATION'
  AND date = CURRENT_DATE;

# Exit
\q
```

**Try to create memory**:
1. **Navigate to Capture**
2. **Enter new text**: "This should fail due to limit"
3. **Click**: "Save Memory"
4. **Expected**:
   - ❌ Error: "Daily memory limit reached (10/10)"
   - ✅ Memory NOT saved

**Reset limit**:
```powershell
# Reset for continued testing
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "UPDATE user_usage SET daily_count = 3 WHERE operation = 'MEMORY_CREATION' AND date = CURRENT_DATE;"
```

### 8.3 Test Invalid Login

1. **Logout** (if logged in)
2. **Navigate to Login**: `http://localhost:5173/login`
3. **Enter wrong credentials**:
   - Email: `test@example.com`
   - Password: `wrongpassword`
4. **Click**: "Sign in"
5. **Expected**:
   - ❌ Error message: "Invalid credentials" or "Login failed"
   - ✅ Stays on login page

### 8.4 Test Protected Routes

1. **Logout** (if logged in)
2. **Try to access protected route directly**:
   ```powershell
   Start-Process "http://localhost:5173/app/capture"
   ```
3. **Expected**:
   - ✅ Redirects to `/login`
   - ✅ Cannot access without authentication

---

## Step 9: Test Circuit Breaker (AI Cost Protection)

### 9.1 Check Circuit Breaker Status

```powershell
# Login as admin
$adminLogin = curl -X POST http://localhost:4000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"admin123"}' | ConvertFrom-Json

$adminToken = $adminLogin.accessToken

# Check circuit breaker
curl http://localhost:4000/api/v1/admin/circuit-breaker `
  -H "Authorization: Bearer $adminToken" | ConvertFrom-Json
```

**Expected Output**:
```json
{
  "state": "CLOSED",
  "dailySpend": {
    "totalCents": 15,
    "percentUsed": 3.0,
    "operationCount": 4
  },
  "budget": {
    "dailyLimitCents": 500,
    "alertThreshold": 0.9
  }
}
```

### 9.2 Simulate Budget Alert (Optional)

```powershell
# Manually trigger near-budget state
# Connect to Redis
docker exec -it memory-connector-redis redis-cli

# Set high spend value (450 cents = $4.50 out of $5.00 budget)
SET ai:daily:spend:20251223 450

# Exit Redis
exit
```

**Check circuit breaker again**:
- ✅ `percentUsed`: Should be ~90%
- ✅ Should trigger alert email (if configured)

---

## Step 10: Frontend Automated Tests

### 10.1 Run Frontend Unit Tests

```powershell
# Navigate to frontend
cd "C:\Visual Studio\Memory Connector\apps\web"

# Run tests
pnpm test
```

**Expected Output**:
```
 PASS  src/pages/CapturePage.test.tsx
 PASS  src/components/ProtectedRoute.test.tsx

Test Suites: X passed, X total
Tests:       X passed, X total
```

### 10.2 Run E2E Tests (Playwright)

```powershell
# Still in apps\web
# Install Playwright browsers (first time only)
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e
```

**Expected Output**:
```
Running 10 tests using 3 workers

  ✓  auth.spec.ts:5:1 › user can log in (500ms)
  ✓  auth.spec.ts:15:1 › user can log out (300ms)
  ✓  memories.spec.ts:5:1 › user can create memory (800ms)
  ✓  memories.spec.ts:20:1 › user can search memories (600ms)

  10 passed (5s)
```

**All tests should pass** ✅

---

## Step 11: Performance Testing

### 11.1 Check Bundle Size

```powershell
# In apps\web directory
pnpm build

# Check build output
```

**Expected Output**:
```
✓ built in 15.23s

dist/index.html                   0.45 kB
dist/assets/index-abc123.css      2.14 kB │ gzip:  0.92 kB
dist/assets/login-def456.js      48.32 kB │ gzip: 15.21 kB
dist/assets/capture-ghi789.js   118.45 kB │ gzip: 38.67 kB
dist/assets/search-jkl012.js    145.23 kB │ gzip: 47.89 kB
dist/assets/vendor-mno345.js    156.78 kB │ gzip: 51.23 kB
```

**Verify**:
- ✅ Total initial load < 250 KB (gzipped)
- ✅ Code splitting working (separate chunk files)
- ✅ No single chunk > 200 KB (gzipped)

### 11.2 Test Page Load Speed

1. **Open DevTools**: Press `F12`
2. **Go to Network tab**
3. **Throttle**: Set to "Fast 3G"
4. **Clear cache**: Right-click refresh button → "Empty Cache and Hard Reload"
5. **Navigate to**: `http://localhost:5173`

**Check Timeline**:
- ✅ DOMContentLoaded: < 2 seconds
- ✅ Load: < 3 seconds
- ✅ Loading indicator appears (Suspense fallback)

### 11.3 Lighthouse Audit (Optional)

1. **Open DevTools**: Press `F12`
2. **Go to Lighthouse tab**
3. **Select**: Performance, Accessibility, Best Practices
4. **Click**: "Generate report"

**Target Scores**:
- ✅ Performance: 85+
- ✅ Accessibility: 90+
- ✅ Best Practices: 90+

---

## Step 12: Final Verification Checklist

### Backend Tests ✅
- [x] Unit tests pass (pnpm test)
- [x] E2E tests pass (pnpm test:e2e)
- [x] Health endpoint returns 200
- [x] Database connection works
- [x] Redis connection works
- [x] pgvector extension enabled

### Frontend Tests ✅
- [x] Unit tests pass
- [x] E2E tests pass (Playwright)
- [x] TypeScript compilation clean (pnpm typecheck)
- [x] Build succeeds (pnpm build)
- [x] Bundle size optimized

### Feature Testing ✅
- [x] User can register (if implemented)
- [x] User can login
- [x] User can logout
- [x] User can create memories
- [x] User can search memories
- [x] User can view reminders
- [x] User can access settings
- [x] Protected routes work

### AI Features ✅
- [x] Enrichment worker starts
- [x] Memories get enriched (status: enriched)
- [x] Embeddings generated (1536 dimensions)
- [x] Categories assigned
- [x] Tags generated
- [x] Sentiment detected
- [x] Reminders extracted
- [x] Semantic search works

### Offline Features ✅
- [x] Can create memory offline
- [x] Memory queued in IndexedDB
- [x] Auto-sync when online
- [x] Offline indicator shows
- [x] No data loss

### Error Handling ✅
- [x] Duplicate content detected
- [x] Usage limits enforced
- [x] Invalid login rejected
- [x] Protected routes redirect
- [x] Circuit breaker works

### Performance ✅
- [x] Initial bundle < 250 KB
- [x] Code splitting working
- [x] Page load < 3s on 3G
- [x] Lazy loading working

---

## 🎉 Testing Complete!

If all checkboxes above are checked ✅, your Memory Connector application is:

✅ **100% Tested**
✅ **Production-Ready**
✅ **Ready for Deployment**

---

## 🐛 Common Issues and Fixes

### Issue: Tests failing with "Port already in use"

**Fix**:
```powershell
# Kill processes
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess -Force
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
```

### Issue: "pgvector extension not found"

**Fix**:
```powershell
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Issue: Enrichment not happening

**Check**:
1. OpenAI API key set: `echo $env:OPENAI_API_KEY`
2. Worker enabled: Check `.env` has `ENRICHMENT_WORKER_ENABLED=true`
3. Check logs: Look for "Starting enrichment worker" in backend terminal

**Fix**:
```powershell
# Set API key
$env:OPENAI_API_KEY = "sk-your-key-here"

# Restart backend
# Press Ctrl+C in backend terminal
pnpm dev
```

### Issue: Semantic search not working (degraded mode)

**Check**:
1. Embeddings exist: Open Prisma Studio → Check `Embedding` table
2. Enrichment status: Check `Memory` table → `enrichmentStatus` = "enriched"

**Fix**: Wait for enrichment to complete (1-3 minutes)

### Issue: Frontend can't connect to backend

**Check**:
1. Backend running: Check Terminal 1
2. CORS configured: Check `.env` has correct `CORS_ORIGIN`

**Fix**:
```powershell
# In apps\api\.env
CORS_ORIGIN=http://localhost:5173
```

---

## 📊 Test Results Summary

**Copy this template to document your test results**:

```
Testing Date: _______________
Tester: _______________

Backend Tests:
- Unit Tests: PASS / FAIL
- E2E Tests: PASS / FAIL
- Coverage: ____%

Frontend Tests:
- Unit Tests: PASS / FAIL
- E2E Tests: PASS / FAIL
- Build: PASS / FAIL

Feature Tests:
- Authentication: PASS / FAIL
- Memory CRUD: PASS / FAIL
- Search: PASS / FAIL
- Offline Sync: PASS / FAIL
- AI Enrichment: PASS / FAIL

Performance:
- Bundle Size: _____ KB
- Load Time: _____ seconds
- Lighthouse Score: _____

Issues Found:
1. _______________
2. _______________

Overall Result: PASS / FAIL

Notes:
_______________
_______________
```

---

**Testing Complete!** 🚀

Next step: Deploy to production using `GODADDY_DEPLOYMENT_GUIDE.md`
