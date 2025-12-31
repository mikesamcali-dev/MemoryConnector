# Remote Server Deployment Guide

This guide provides step-by-step instructions for deploying the latest code to your remote server.

## Prerequisites

- SSH access to the remote server
- Git repository access
- Node.js and pnpm installed on the server
- PostgreSQL and Redis running
- Existing `.env` file configured

---

## Deployment Steps

### 1. Connect to Remote Server

```bash
ssh root@11
```

### 2. Navigate to Project Directory

```bash
cd /var/www/memory-connector/MemoryConnector
```

### 3. Check Current Status

Before making changes, verify the current state:

```bash
# Check current branch and status
git status

# Check current commit
git log -1 --oneline

# Verify services are running
docker ps
```

### 4. Backup Database (Recommended)

Create a backup before deploying:

```bash
# Create backup directory if it doesn't exist
mkdir -p backups

# Backup database
docker exec memory-connector-postgres pg_dump -U postgres memory_connector > backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Or use the pnpm script if available
pnpm db:backup
```

### 5. Pull Latest Code

```bash
# Fetch latest changes
git fetch origin

# Pull and merge
git pull origin main
```

**Expected Output:**
```
Updating 32d190e..96524b5
Fast-forward
 [list of changed files]
```

### 6. Install/Update Dependencies

```bash
# Install dependencies for all workspaces
pnpm install
```

**What this does:**
- Installs new packages added to package.json
- Updates existing packages if lockfile changed
- Links workspace dependencies

### 7. Regenerate Prisma Client

**CRITICAL:** This step regenerates TypeScript types to match your updated schema.

```bash
cd apps/api

# Generate Prisma client
pnpm db:generate
```

**Expected Output:**
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client
```

**Why this is important:**
- The Prisma client must match your schema.prisma file
- Without regenerating, TypeScript will throw errors about missing properties
- This fixes errors like "Property 'textContent' does not exist"

### 8. Run Database Migrations

Apply any new schema changes to the database:

```bash
# Still in apps/api directory
pnpm db:migrate
```

**What this does:**
- Applies new migrations from `prisma/migrations/` directory
- Updates database schema to match schema.prisma
- If no new migrations, it will say "Already in sync"

**Common Migration Names (from recent changes):**
- `20251227152152_add_person_as_shared_entity`
- `20251227154144_add_person_relationships`
- `20251228162313_add_audit_trail`
- `20251228224043_add_youtube_videos_table`
- `20251229145118_tiktoktables`
- `20251230103309_add_image_support`
- `20251230113526_add_url_pages`

### 9. Verify Environment Variables

Make sure your `.env` file has all required variables:

```bash
# Check if .env exists
ls -la apps/api/.env

# Verify required variables (don't print values!)
cd apps/api
cat .env | grep -E "^(DATABASE_URL|OPENAI_API_KEY|ASSEMBLYAI_API_KEY|R2_|REDIS_URL)" | cut -d'=' -f1
```

**Required Variables:**
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/memory_connector

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI (MUST BE ROTATED - see Security section below)
OPENAI_API_KEY=sk-proj-...

# AssemblyAI (MUST BE ROTATED)
ASSEMBLYAI_API_KEY=...

# Cloudflare R2 (MUST BE ROTATED)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=imageconnect
R2_PUBLIC_URL=https://...
R2_ENDPOINT=https://...

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# App Config
NODE_ENV=production
PORT=4000
FRONTEND_URL=http://your-frontend-domain.com
```

### 10. Build the Application

Go back to project root and build:

```bash
cd /var/www/memory-connector/MemoryConnector

# Build all workspaces
pnpm build
```

**Expected Output:**
```
> @memory-connector/api@0.1.0 build
> nest build

> @memory-connector/web@0.1.0 build
> vite build

✓ built in Xs
```

**If build fails:**
- Check the error messages carefully
- Verify Prisma client was regenerated (step 7)
- Ensure all dependencies installed (step 6)
- See Troubleshooting section below

### 11. Restart Services

Restart your application to load the new code:

```bash
# If using PM2
pm2 restart memory-connector-api
pm2 restart memory-connector-web

# If using systemd
sudo systemctl restart memory-connector-api
sudo systemctl restart memory-connector-web

# If using Docker Compose
docker-compose restart api web

# If running manually
# Kill the old processes and restart
```

**Verify services started:**
```bash
# PM2
pm2 status
pm2 logs memory-connector-api --lines 50

# Docker
docker ps
docker logs memory-connector-api --tail 50

# Check ports
netstat -tlnp | grep -E ':(4000|5173)'
```

### 12. Verify Deployment

Test that everything is working:

```bash
# Check API health
curl http://localhost:4000/health

# Check API version/info
curl http://localhost:4000/api/v1/health

# Check frontend (if served from server)
curl http://localhost:5173

# Monitor logs for errors
pm2 logs --lines 100
# or
docker logs -f memory-connector-api
```

**Test Key Features:**
1. Login/Authentication
2. Create a memory
3. Search memories
4. View reminders

---

## Security: Rotate Exposed API Keys

**CRITICAL:** The following API keys were exposed in git history and MUST be rotated immediately.

### OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Find key starting with: `sk-proj-W9sXWBlf...`
3. Click "Revoke" or "Delete"
4. Click "Create new secret key"
5. Copy the new key
6. Update your `.env` file:
   ```bash
   nano apps/api/.env
   # Update OPENAI_API_KEY=sk-proj-NEW_KEY_HERE
   ```

### AssemblyAI API Key

1. Go to: https://www.assemblyai.com/app/account
2. Navigate to API Keys section
3. Delete/regenerate your API key
4. Copy the new key
5. Update your `.env` file:
   ```bash
   nano apps/api/.env
   # Update ASSEMBLYAI_API_KEY=NEW_KEY_HERE
   ```

### Cloudflare R2 Credentials

1. Go to: https://dash.cloudflare.com/
2. Navigate to: R2 → Manage R2 API Tokens
3. Find and delete the exposed token
4. Create a new API token with R2 permissions
5. Copy the new credentials
6. Update your `.env` file:
   ```bash
   nano apps/api/.env
   # Update:
   # R2_ACCESS_KEY_ID=NEW_ACCESS_KEY
   # R2_SECRET_ACCESS_KEY=NEW_SECRET_KEY
   ```

**After updating .env:**
```bash
# Restart services to load new credentials
pm2 restart memory-connector-api
# or
docker-compose restart api
```

**Verify new keys work:**
```bash
# Check logs for any auth errors
pm2 logs memory-connector-api --lines 50 | grep -i error
```

---

## Troubleshooting

### Build Fails with Module Not Found Errors

**Problem:**
```
Cannot find module './words/words.module'
Cannot find module './events/events.module'
```

**Solution:**
```bash
# Ensure you pulled the latest code
git status
git pull origin main

# Verify the files exist
ls -la apps/api/src/words/words.module.ts
ls -la apps/api/src/events/events.module.ts

# If files exist but still errors, clean and rebuild
rm -rf node_modules
rm -rf apps/api/node_modules
rm -rf apps/web/node_modules
pnpm install
cd apps/api && pnpm db:generate && cd ../..
pnpm build
```

### Build Fails with Prisma Type Errors

**Problem:**
```
error TS2339: Property 'textContent' does not exist on type
error TS2339: Property 'type' does not exist on type
```

**Solution:**
```bash
# Regenerate Prisma client
cd apps/api
pnpm db:generate

# Verify generation was successful
ls -la node_modules/.prisma/client/

# Clean TypeScript cache
rm -rf apps/api/dist
rm -rf apps/web/dist

# Rebuild
cd ../..
pnpm build
```

### Database Connection Errors

**Problem:**
```
Error: Can't reach database server
```

**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker start memory-connector-postgres

# Test connection
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "SELECT 1;"

# Check DATABASE_URL in .env
cat apps/api/.env | grep DATABASE_URL
```

### Migration Errors

**Problem:**
```
Migration failed: relation "memory_types" already exists
```

**Solution:**
```bash
# Check migration status
cd apps/api
npx prisma migrate status

# If schema is out of sync, resolve it
npx prisma migrate resolve --applied "migration-name"

# Or reset database (DESTRUCTIVE - only in dev)
# npx prisma migrate reset
```

### pgvector Extension Missing

**Problem:**
```
Error: extension "vector" does not exist
```

**Solution:**
```bash
# Install pgvector extension
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Re-run migrations
cd apps/api
pnpm db:migrate
```

### Port Already in Use

**Problem:**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**
```bash
# Find process using port
lsof -i :4000
# or
netstat -tlnp | grep :4000

# Kill the process
kill -9 <PID>

# Or restart the service properly
pm2 restart memory-connector-api
```

### BigInt Serialization Errors

**Problem:**
```
Do not know how to serialize a BigInt
```

**Solution:**
This should be fixed in the code, but if you see this:
- The code is trying to return a BigInt value in JSON
- PostgreSQL returns numeric columns as BigInt via `$queryRaw`
- Contact developer to fix by wrapping with `Number()`

---

## Rollback Procedure

If deployment fails and you need to rollback:

```bash
# 1. Check git log to find previous commit
git log --oneline -5

# 2. Rollback code to previous commit
git reset --hard <previous-commit-hash>

# 3. Rebuild with old code
pnpm install
cd apps/api && pnpm db:generate && cd ../..
pnpm build

# 4. Restart services
pm2 restart all
# or
docker-compose restart
```

**Note:** This only rolls back code. Database migrations cannot be automatically reversed.

---

## Post-Deployment Checklist

- [ ] Code pulled successfully
- [ ] Dependencies installed
- [ ] Prisma client regenerated
- [ ] Migrations applied
- [ ] Build completed without errors
- [ ] Services restarted
- [ ] Health check endpoint returns 200
- [ ] Can login to application
- [ ] Can create a memory
- [ ] Search functionality works
- [ ] **API keys rotated** (OpenAI, AssemblyAI, R2)
- [ ] No errors in logs
- [ ] Frontend loads correctly
- [ ] Database connection working

---

## Monitoring

After deployment, monitor for issues:

```bash
# Watch logs in real-time
pm2 logs --lines 100
# or
docker logs -f memory-connector-api

# Check for errors
pm2 logs memory-connector-api --err

# Monitor API requests
tail -f /var/log/nginx/access.log  # if using nginx
```

**Key things to watch:**
- Authentication errors
- Database connection errors
- API key errors (OpenAI, AssemblyAI, R2)
- Memory creation failures
- Search failures

---

## Performance Optimization (Optional)

If needed after deployment:

```bash
# Clear Redis cache
docker exec -it memory-connector-redis redis-cli FLUSHALL

# Vacuum database
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "VACUUM ANALYZE;"

# Restart with increased memory (PM2)
pm2 restart memory-connector-api --max-memory-restart 1G
```

---

## Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs carefully for error messages
3. Verify all steps were completed in order
4. Check that environment variables are correct
5. Ensure database and Redis are running
6. Verify API keys are valid and rotated

**Common Issues:**
- Forgot to run `pnpm db:generate` → TypeScript errors
- Forgot to run migrations → Database schema mismatch
- Old API keys → 401 Authentication errors
- Database not running → Connection refused errors

---

## Quick Reference

```bash
# Complete deployment in one go (if everything works)
cd /var/www/memory-connector/MemoryConnector && \
  git pull origin main && \
  pnpm install && \
  cd apps/api && \
  pnpm db:generate && \
  pnpm db:migrate && \
  cd ../.. && \
  pnpm build && \
  pm2 restart all

# Then verify
pm2 status && \
  curl http://localhost:4000/health && \
  pm2 logs --lines 50
```

**Remember:** Always rotate the exposed API keys before considering the deployment complete!
