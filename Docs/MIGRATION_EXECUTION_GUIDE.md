# Migration Execution Guide: Hybrid Memory Types

This guide walks you through executing the hybrid memory types migration safely on your development environment.

## ⚠️ Important Warnings

- **This is a BREAKING CHANGE** - The schema is significantly restructured
- **Backup your database** before proceeding
- **Stop all running services** to avoid conflicts
- **Test on development first** - Never run directly on production
- **The migration takes 5-10 minutes** depending on data size

## Pre-Migration Checklist

### 1. Verify Environment

```powershell
# Check you're in the right directory
cd "C:\Visual Studio\Memory Connector"

# Verify Docker containers are running
docker ps
# Should see: memory-connector-postgres and memory-connector-redis

# Check database connection
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "SELECT COUNT(*) FROM memories;"
```

### 2. Create Database Backup

**CRITICAL: Do not skip this step!**

```powershell
# Create backup directory
mkdir -p backups

# Backup database
docker exec memory-connector-postgres pg_dump -U postgres memory_connector > "backups/pre-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"

# Verify backup was created
dir backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

### 3. Stop All Services

```powershell
# Stop dev servers if running
# Press Ctrl+C in terminals running:
# - pnpm dev (root)
# - or individual service dev servers

# Verify no processes are using Prisma client
# (Check Task Manager if needed)
```

## Migration Steps

### Step 1: Generate Prisma Client

```powershell
cd apps\api

# Generate Prisma client from new schema
pnpm db:generate
```

**Expected Output:**
```
✔ Generated Prisma Client
```

**If you see errors:**
- File lock error: Close VSCode, stop all Node processes, try again
- Schema errors: Review schema.prisma for syntax issues

### Step 2: Run the Migration

```powershell
# Apply the migration to the database
pnpm prisma migrate deploy
```

**Expected Output:**
```
The following migrations have been applied:

migrations/
  └─ 20251226000000_hybrid_memory_types/
    └─ migration.sql

All migrations have been successfully applied.
```

**Alternative (if deploy doesn't work):**
```powershell
# Run migration manually
docker exec -i memory-connector-postgres psql -U postgres memory_connector < prisma/migrations/20251226000000_hybrid_memory_types/migration.sql
```

### Step 3: Verify Migration

```powershell
# Check new enums were created
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "\dT+"

# Should show:
# - StorageStrategy (generic, structured)
# - LinkType (locatedAt, summaryOf, hasMedia, related, mentions)

# Check new tables were created
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "\dt"

# Should include:
# - memory_type_assignments
# - memory_links
# - people

# Check restructured tables
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "\d events"
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "\d locations"
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "\d words"

# Primary key should be memory_id for all three

# Check memories table has new columns
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "\d memories"

# Should include: title, body, occurred_at, start_at, end_at, data
# Should NOT include: type_id, word_id, event_id, location_id, entity_id, text_content
```

### Step 4: Check Data Migration

```powershell
# Verify data was migrated
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector

# In psql shell:
memory_connector=# SELECT COUNT(*) FROM memories;
memory_connector=# SELECT COUNT(*) FROM memory_type_assignments;
memory_connector=# SELECT COUNT(*) FROM memory_links;
memory_connector=# SELECT * FROM memory_types LIMIT 5;
memory_connector=# \q
```

**Expected Results:**
- Memory count should match pre-migration count
- memory_type_assignments should have entries for memories that had types
- memory_links should have entries from old memory_relationships
- memory_types should show code, label, storage_strategy, table_name columns

### Step 5: Seed Fresh Test Data

```powershell
# Reset database and seed with new structure
# WARNING: This deletes all data!
pnpm db:reset

# Or just run seed on existing data
pnpm db:seed
```

**Expected Output:**
```
Seeding database...
Created 7 memory types
Created 6 test memories with various types:
  - 1 generic note
  - 1 structured event
  - 1 structured location
  - 1 structured word
  - 1 structured person
  - 1 generic idea
  - 1 memory link (event at location)
Seeding completed!
Test user: test@example.com / password123
```

### Step 6: Start Services

```powershell
# From root directory
cd ..\..

# Start all services
pnpm dev
```

Wait for:
```
[api] [Nest] INFO  [NestFactory] Starting Nest application...
[api] [Nest] INFO  Application is running on: http://localhost:4000
[web] VITE ready in XXX ms
[web] ➜  Local:   http://localhost:5173/
```

## Post-Migration Verification

### 1. API Health Check

```powershell
# Test API is responding
curl http://localhost:4000/api/v1/health
```

**Expected:** `{"status":"ok"}`

### 2. Test Login

```powershell
# Login with test user
curl -X POST http://localhost:4000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123"}'
```

**Expected:** Should return access token

### 3. Test Memory Creation

Open browser to http://localhost:5173 and:

1. **Login**: test@example.com / password123
2. **Go to Capture page**
3. **Create a new memory**:
   - Type: "This is a test memory"
   - Should save successfully
4. **Check memory details**: Should show title/body instead of textContent

### 4. Test Structured Types

#### Test Word Memory
1. Go to Capture page
2. Select "Word" type (if available in dropdown)
3. Enter: "Ephemeral"
4. Submit
5. Check memory details - should show word definition, phonetic, etc.

#### Test Event Memory
1. Create memory with "Event" type
2. Enter: "Team Standup Meeting"
3. Submit
4. Check memory details - should show event details

#### Test Location Memory
1. Create memory with "Location" type
2. Enter: "Central Park"
3. Allow geolocation if prompted
4. Submit
5. Check memory details - should show location data

### 5. Test Admin Dashboard

1. **Make test user an admin**:
```powershell
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "UPDATE users SET roles = '{user,admin}' WHERE email = 'test@example.com';"
```

2. **Access admin dashboard**: http://localhost:5173/app/admin

3. **Check stats**:
   - Total users should show
   - Total memories should show
   - Click on cards to see drill-down modals

4. **Check memory types tab**:
   - Should show 7 memory types
   - Should display storage strategy (generic/structured)
   - Should show table names for structured types

### 6. Check Database Integrity

```powershell
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector

# Check for orphaned records
SELECT COUNT(*) FROM memory_type_assignments mta
LEFT JOIN memories m ON mta.memory_id = m.id
WHERE m.id IS NULL;
# Should return 0

# Check for missing type assignments
SELECT COUNT(*) FROM memories m
LEFT JOIN memory_type_assignments mta ON m.id = mta.memory_id
WHERE mta.memory_id IS NULL;
# May have some - generic memories don't require types

# Check structured type integrity
SELECT COUNT(*) FROM events e
LEFT JOIN memories m ON e.memory_id = m.id
WHERE m.id IS NULL;
# Should return 0

# Exit psql
\q
```

## Troubleshooting

### Issue: Migration Fails with Foreign Key Errors

**Symptoms:**
```
ERROR: foreign key constraint violation
```

**Solution:**
```powershell
# Check for orphaned records
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector

# Find orphaned memories
SELECT id FROM memories WHERE user_id NOT IN (SELECT id FROM users);

# Delete orphaned memories (if any)
DELETE FROM memories WHERE user_id NOT IN (SELECT id FROM users);

# Retry migration
```

### Issue: Prisma Client Generation Fails

**Symptoms:**
```
EPERM: operation not permitted
```

**Solution:**
```powershell
# Stop ALL Node processes
# Close VSCode
# Delete node_modules\.prisma directory
Remove-Item -Recurse -Force node_modules\.prisma

# Regenerate
pnpm db:generate
```

### Issue: Old Data Still Showing

**Symptoms:**
- API returns old field names (textContent instead of title/body)
- Memory types show old fields (name, slug instead of code, label)

**Solution:**
```powershell
# Clear Prisma cache
cd apps\api
Remove-Item -Recurse -Force node_modules\.prisma
pnpm db:generate

# Restart dev server
cd ..\..
# Stop dev server (Ctrl+C)
pnpm dev
```

### Issue: Services Won't Start

**Symptoms:**
```
Error: Unknown field name 'type_id'
```

**Solution:**
```powershell
# You're using old service code
# Ensure all service files were updated:
git status

# Should show modified:
# - memories.service.ts
# - words.service.ts
# - events.service.ts
# - locations.service.ts
# - admin.controller.ts
```

### Issue: Frontend Errors

**Symptoms:**
- TypeScript errors about missing fields
- Runtime errors about undefined properties

**Solution:**
```powershell
# Update frontend API types
# Check apps/web/src/api/admin.ts
# Should have updated MemoryType interface

# Restart frontend dev server
cd apps\web
# Stop server (Ctrl+C)
pnpm dev
```

## Rollback Plan

If migration fails and you need to rollback:

### Option 1: Restore from Backup

```powershell
# Stop services
# Stop dev servers

# Drop and recreate database
docker exec -it memory-connector-postgres psql -U postgres -c "DROP DATABASE memory_connector;"
docker exec -it memory-connector-postgres psql -U postgres -c "CREATE DATABASE memory_connector;"

# Restore from backup
$BACKUP_FILE = (Get-ChildItem backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
Get-Content $BACKUP_FILE | docker exec -i memory-connector-postgres psql -U postgres memory_connector

# Revert schema.prisma to old version
git checkout HEAD~1 apps/api/prisma/schema.prisma

# Regenerate client
cd apps\api
pnpm db:generate

# Restart services
cd ..\..
pnpm dev
```

### Option 2: Fresh Start

```powershell
# Nuclear option: Start completely fresh
pnpm db:down
pnpm db:up

# Checkout old schema
git checkout HEAD~1 apps/api/prisma/schema.prisma

# Setup database
cd apps\api
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Start services
cd ..\..
pnpm dev
```

## Success Criteria

Migration is successful when:

- ✅ All services start without errors
- ✅ Can login with test user
- ✅ Can create memories with different types
- ✅ Admin dashboard displays correctly
- ✅ Memory types show storage strategy
- ✅ Structured types (words, events, locations) work
- ✅ Generic types (notes, ideas) work
- ✅ No orphaned records in database
- ✅ All foreign key constraints valid

## Next Steps After Successful Migration

1. **Test all features thoroughly**
   - Memory creation (all types)
   - Memory search
   - Memory links
   - Reminders
   - Admin operations

2. **Update frontend components** (if needed)
   - Memory detail views
   - Memory list views
   - Type selectors

3. **Run E2E tests**
   ```powershell
   cd apps\api
   pnpm test:e2e
   ```

4. **Performance testing**
   - Create 100+ memories
   - Test search performance
   - Check query times

5. **Document any issues** found during testing

## Production Migration (Future)

**DO NOT run on production until:**

- ✅ All development testing complete
- ✅ All E2E tests passing
- ✅ Performance validated
- ✅ Rollback plan tested
- ✅ Maintenance window scheduled
- ✅ Team notified
- ✅ Database backup verified

---

## Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Review the migration SQL file: `apps/api/prisma/migrations/20251226000000_hybrid_memory_types/migration.sql`
3. Check application logs for errors
4. Verify database state with SQL queries

**Remember:** You can always rollback using the backup!
