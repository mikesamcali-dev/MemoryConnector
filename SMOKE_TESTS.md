# Smoke Test Commands

Run these commands from a clean clone to verify the implementation.

## Prerequisites

```bash
# Ensure you have:
# - Node.js >= 18
# - pnpm >= 8
# - Docker and Docker Compose
```

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start database and Redis
pnpm db:up

# 3. Generate Prisma client
cd apps/api
pnpm db:generate

# 4. Run migrations
pnpm db:migrate

# 5. Seed database
pnpm db:seed

# 6. Start development servers (in separate terminals)
# Terminal 1: API
cd apps/api
pnpm dev

# Terminal 2: Web
cd apps/web
pnpm dev
```

## Smoke Tests

### 1. Health Check

```bash
curl http://localhost:4000/api/v1/health
```

Expected: `{"status":"ok","timestamp":"...","services":{"database":"ok"}}`

### 2. Signup

```bash
curl -X POST http://localhost:4000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected: Returns accessToken and user object

### 3. Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected: Returns accessToken and user object

### 4. Create Memory with Idempotency

```bash
# First request
curl -X POST http://localhost:4000/api/v1/memories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -d '{"textContent":"Test memory"}'

# Retry same request (should get replayed response)
curl -X POST http://localhost:4000/api/v1/memories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -d '{"textContent":"Test memory"}'
```

Expected: Second request returns cached response with `X-Idempotency-Replayed: true` header

### 5. Search (Semantic)

```bash
curl "http://localhost:4000/api/v1/search?q=test" \
  -H "Authorization: Bearer <token>"
```

Expected: Returns results with `method: "semantic"` or `method: "keyword"` with `degraded: true` if fallback

### 6. Force Degraded Search

To test degraded search banner, temporarily break semantic search in `search.service.ts`:

```typescript
// In searchMemories, throw error immediately
throw new Error('Semantic search failed');
```

Then test search - should return `degraded: true` and frontend should show banner.

### 7. Reminders Inbox

```bash
curl http://localhost:4000/api/v1/reminders/inbox \
  -H "Authorization: Bearer <token>"
```

Expected: Returns `{unreadCount: 0, reminders: []}` or reminders if seeded

### 8. Mark Reminder as Read

```bash
curl -X POST http://localhost:4000/api/v1/reminders/<reminder-id>/read \
  -H "Authorization: Bearer <token>"
```

Expected: `{success: true}`

### 9. Run Tests

```bash
# Backend tests
cd apps/api
pnpm test

# Frontend tests
cd apps/web
pnpm test

# E2E tests (requires Playwright setup)
cd apps/web
pnpm test:e2e
```

### 10. Test Tier Limits

```bash
# Create 11 memories (free tier limit is 10/day)
# Should get 429 on 11th request
for i in {1..11}; do
  curl -X POST http://localhost:4000/api/v1/memories \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: test-key-$i" \
    -d "{\"textContent\":\"Memory $i\"}"
done
```

Expected: 11th request returns 429 with `LIMIT_EXCEEDED` error

### 11. Test Duplicate Detection

```bash
# Create memory
curl -X POST http://localhost:4000/api/v1/memories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-dup-1" \
  -d '{"textContent":"Duplicate test"}'

# Try to create same content again immediately
curl -X POST http://localhost:4000/api/v1/memories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-dup-2" \
  -d '{"textContent":"Duplicate test"}'
```

Expected: Second request returns 409 with `DUPLICATE_CONTENT` error

### 12. Frontend Tests

1. Open http://localhost:5173
2. Sign up with new account
3. Create a memory
4. Search for memories
5. Check reminders inbox
6. Test offline mode (disable network in DevTools, create memory, re-enable network)

## Verification Checklist

- [ ] Health endpoint responds
- [ ] Signup creates user
- [ ] Login returns token
- [ ] Memory creation works
- [ ] Idempotency replay works
- [ ] Search returns results
- [ ] Reminders inbox loads
- [ ] Tier limits enforced (429 on limit)
- [ ] Duplicate detection works (409 on duplicate)
- [ ] Frontend loads and navigates
- [ ] Tests pass

## Troubleshooting

### Database connection issues
- Check Docker containers: `docker ps`
- Check logs: `docker logs memory-connector-postgres`

### Redis connection issues
- Check Redis: `docker exec memory-connector-redis redis-cli ping`

### Prisma issues
- Regenerate client: `cd apps/api && pnpm db:generate`
- Check migrations: `pnpm db:migrate status`

### Frontend build issues
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check Vite config: `apps/web/vite.config.ts`

