# Memory Connector - Production Deployment Guide

## Prerequisites

- SSH access to production server (160.153.184.11)
- SSH key authentication configured
- PM2 installed on server
- PostgreSQL and Redis running on server

## SSH Configuration

Add to `~/.ssh/config`:

```
Host memory-deploy
    HostName 160.153.184.11
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

## Deployment Process

### 1. Commit Changes Locally

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "Your commit message here

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to repository (optional)
git push origin main
```

### 2. Sync Code to Production Server

```bash
# From your local project root
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.env.local' \
  --delete \
  ./ memory-deploy:/var/www/memory-connector/
```

**Important excludes:**
- `node_modules` - Will be installed on server
- `.git` - Not needed on production
- `dist` - Will be rebuilt on server
- `.env.local` - Don't sync local environment config

### 3. Build on Production Server

#### Backend Build

```bash
# SSH into server
ssh memory-deploy

# Navigate to project
cd /var/www/memory-connector

# Install dependencies (if package.json changed)
pnpm install

# Build backend
cd apps/api
pnpm build

# Verify build succeeded
ls -la dist/main.js
```

#### Frontend Build (if needed)

```bash
cd /var/www/memory-connector/apps/web
pnpm build
```

### 4. Restart Application

#### Using PM2 (Recommended)

```bash
# Restart with updated environment variables
pm2 restart memory-connector-api --update-env

# Or fully reload configuration
pm2 delete memory-connector-api
pm2 start /var/www/memory-connector/ecosystem.config.js

# Verify it's running
pm2 list
pm2 logs memory-connector-api --lines 50
```

#### Verify Health

```bash
curl http://localhost:4000/api/v1/health
# Expected: {"status":"ok","timestamp":"...","services":{"database":"ok"}}
```

## Environment Configuration

### Production Environment Variables

Critical environment variables are managed via PM2 `ecosystem.config.js`:

```javascript
// Location: /var/www/memory-connector/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'memory-connector-api',
    cwd: '/var/www/memory-connector/apps/api',
    script: 'dist/main.js',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://memory_user:PASSWORD@localhost:5432/memory_connector',
      REDIS_URL: 'redis://:PASSWORD@localhost:6379',
      FRONTEND_URL: 'https://memoryconnector.com',
      GOOGLE_CALLBACK_URL: 'https://memoryconnector.com/api/v1/auth/google/callback',
      // ... other env vars
    }
  }]
};
```

### Important Configuration Notes

1. **FRONTEND_URL**: Must be set to `https://memoryconnector.com` for OAuth redirects
2. **GOOGLE_CALLBACK_URL**: Must use HTTPS and match Google Cloud Console settings
3. **DATABASE_URL**: Uses `memory_user` (not `postgres`) with proper credentials
4. **NODE_ENV**: Must be `production` to disable dev features

### Updating Environment Variables

When you modify `.env` files or need to change environment variables:

1. **Edit ecosystem.config.js** (preferred for production):
   ```bash
   ssh memory-deploy
   nano /var/www/memory-connector/ecosystem.config.js
   # Make your changes
   ```

2. **Reload PM2 completely** to pick up changes:
   ```bash
   pm2 delete memory-connector-api
   pm2 start /var/www/memory-connector/ecosystem.config.js
   ```

3. **Verify the change**:
   ```bash
   pm2 env 0 | grep VARIABLE_NAME
   ```

⚠️ **Note**: Using `pm2 restart --update-env` may not reload `ecosystem.config.js` changes. Always use `delete` + `start` for config changes.

## Common Issues & Solutions

### Issue: Multiple Instances Running

**Symptoms:**
- EADDRINUSE error on port 4000
- Database authentication fails randomly
- Health check shows degraded status

**Solution:**
```bash
# Check for multiple instances
ps aux | grep 'dist/main.js' | grep -v grep

# Kill rogue processes (as root if needed)
kill -9 PID

# Check both PM2 instances (deploy and root users)
pm2 list  # as deploy user
sudo -u root pm2 list  # as root user

# Stop root's PM2 if running
sudo -u root pm2 stop memory-connector-api
sudo -u root pm2 delete memory-connector-api
```

### Issue: Database Authentication Failed

**Symptoms:**
- "Authentication failed for user `memory_user`"
- Google OAuth fails after login

**Root Causes:**
1. Multiple app instances using different credentials
2. PM2 using outdated environment variables
3. Root's PM2 instance running alongside deploy's instance

**Solution:**
1. Ensure only ONE instance is running (see above)
2. Verify correct credentials in ecosystem.config.js
3. Reload PM2 configuration completely

### Issue: TypeScript Build Cache Corrupted

**Symptoms:**
- `pnpm build` succeeds but `dist/main.js` doesn't exist
- Only `.d.ts` files generated

**Solution:**
```bash
cd /var/www/memory-connector/apps/api
rm tsconfig.build.tsbuildinfo
pnpm exec tsc --build --clean
pnpm build
```

### Issue: Port 4000 Already in Use

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000
# or
netstat -tulpn | grep :4000

# Kill the process
kill -9 PID
```

## Database Migrations

When schema changes are needed:

```bash
ssh memory-deploy
cd /var/www/memory-connector/apps/api

# Generate Prisma client (after schema.prisma changes)
pnpm db:generate

# Run migrations
pnpm prisma migrate deploy

# Restart app
pm2 restart memory-connector-api
```

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
pm2 logs memory-connector-api

# Last 100 lines
pm2 logs memory-connector-api --lines 100 --nostream

# Error logs only
tail -f /var/log/memory-connector/api-error.log

# Output logs only
tail -f /var/log/memory-connector/api-out.log
```

### Check Application Status

```bash
# PM2 status
pm2 status

# Detailed info
pm2 show memory-connector-api

# Resource usage
pm2 monit

# Environment variables
pm2 env 0
```

### Health Check

```bash
# API health
curl http://localhost:4000/api/v1/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-03T...", "services":{"database":"ok"}}
```

## Quick Reference Commands

```bash
# Full deployment from local machine
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --delete ./ memory-deploy:/var/www/memory-connector/
ssh memory-deploy "cd /var/www/memory-connector && pnpm install && cd apps/api && pnpm build && pm2 restart memory-connector-api --update-env"

# Restart after config changes
ssh memory-deploy "cd /var/www/memory-connector && pm2 delete memory-connector-api && pm2 start ecosystem.config.js"

# Check logs for errors
ssh memory-deploy "pm2 logs memory-connector-api --lines 50 --nostream | grep -i error"

# Verify only one instance running
ssh memory-deploy "ps aux | grep 'dist/main.js' | grep -v grep"
```

## Production URLs

- **Frontend**: https://memoryconnector.com
- **API**: https://memoryconnector.com/api/v1
- **API Docs**: https://memoryconnector.com/api/v1/docs
- **Health Check**: https://memoryconnector.com/api/v1/health

## Security Notes

1. **Never commit sensitive data** to git (.env files with real secrets)
2. **Use ecosystem.config.js** for production environment variables
3. **Keep SSH keys secure** and use ed25519 format
4. **Regularly update dependencies** and monitor security advisories
5. **Monitor logs** for suspicious activity

## Troubleshooting Checklist

When deployment issues occur:

- [ ] Is only ONE instance of the app running?
- [ ] Are PM2 environment variables correct? (`pm2 env 0`)
- [ ] Did the build succeed? (`ls -la apps/api/dist/main.js`)
- [ ] Is the database accessible? (`curl http://localhost:4000/api/v1/health`)
- [ ] Are there errors in logs? (`pm2 logs memory-connector-api --lines 100`)
- [ ] Is NODE_ENV set to 'production'? (`pm2 env 0 | grep NODE_ENV`)

## Rollback Procedure

If deployment causes issues:

```bash
# SSH to server
ssh memory-deploy

# Navigate to project
cd /var/www/memory-connector

# Checkout previous commit
git checkout HEAD~1

# Rebuild
cd apps/api && pnpm build

# Restart
pm2 restart memory-connector-api
```

## Related Documentation

- [Main README](./README.md)
- [Project Instructions](./CLAUDE.md)
- [GoDaddy Deployment Guide](./Docs/GODADDY_DEPLOYMENT_GUIDE.md)
- [Windows Debugging Guide](./Docs/DEBUGGING_AND_TESTING_WINDOWS.md)
