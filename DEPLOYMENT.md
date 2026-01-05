# Memory Connector Deployment Guide

## Quick Deploy

```bash
# Deploy everything (API + Web)
./deploy.sh

# Deploy API only
./deploy.sh api

# Deploy Web only
./deploy.sh web
```

## Prerequisites

1. **SSH Access**: Ensure you have SSH key access to the production server
   ```bash
   ssh -i ~/.ssh/id_ed25519 memconnadmin@160.153.184.11
   ```

2. **SSH Config** (Optional but recommended):
   Add to `~/.ssh/config`:
   ```
   Host memconn
       HostName 160.153.184.11
       User memconnadmin
       IdentityFile ~/.ssh/id_ed25519
       ServerAliveInterval 60
       ServerAliveCountMax 3
   ```
   Then you can just run: `ssh memconn`

3. **Dependencies**: Node.js, npm, and Git Bash (Windows) or any Unix shell

## Deployment Process

### What Happens During Deployment

1. **Local Build** (Windows):
   - API: `cd apps/api && npm run build`
   - Web: `cd apps/web && npm run build`

2. **Package**:
   - Creates `dist.tar.gz` from built files

3. **Upload**:
   - Uploads tar file to `/tmp/` on production server

4. **Deploy**:
   - Backs up current `dist/` directory
   - Extracts new build
   - Restarts PM2 (API only)

5. **Verify**:
   - Checks API health endpoint
   - Tests web homepage

### Why Build Locally?

**Problem**: The production server's TypeScript build is broken - `nest build` only generates `.d.ts` declaration files, not the actual `.js` files.

**Root Cause**: Unknown TypeScript/NestJS configuration issue on the production environment.

**Solution**: Build locally where it works, then deploy the compiled files.

## Manual Deployment

If the scripts fail, you can deploy manually:

### API Manual Deploy

```bash
# 1. Build locally
cd apps/api
npm run build
tar -czf dist.tar.gz dist

# 2. Upload
scp -i ~/.ssh/id_ed25519 dist.tar.gz memconnadmin@160.153.184.11:/tmp/

# 3. Deploy on server
ssh -i ~/.ssh/id_ed25519 memconnadmin@160.153.184.11
cd /var/www/memory-connector/apps/api
mv dist dist.backup.$(date +%Y%m%d_%H%M%S)
tar -xzf /tmp/dist.tar.gz
pm2 restart memory-connector-api
pm2 status
exit

# 4. Clean up locally
rm dist.tar.gz
```

### Web Manual Deploy

```bash
# 1. Build locally
cd apps/web
npm run build
tar -czf dist.tar.gz dist

# 2. Upload
scp -i ~/.ssh/id_ed25519 dist.tar.gz memconnadmin@160.153.184.11:/tmp/web-dist.tar.gz

# 3. Deploy on server
ssh -i ~/.ssh/id_ed25519 memconnadmin@160.153.184.11
cd /var/www/memory-connector/apps/web
mv dist dist.backup.$(date +%Y%m%d_%H%M%S)
tar -xzf /tmp/web-dist.tar.gz
chmod -R 755 dist
exit

# 4. Clean up locally
rm dist.tar.gz
```

## Common Issues & Solutions

### Issue: "Permission denied (publickey)"

**Solution**: Ensure SSH key is loaded
```bash
# Check if key is loaded
ssh-add -l

# Add key if needed
ssh-add ~/.ssh/id_ed25519

# Or use explicit key in command
ssh -i ~/.ssh/id_ed25519 memconnadmin@160.153.184.11
```

### Issue: "Search failed" or 404 errors on production

**Root Cause**: Service worker caching old responses

**Solution**: Clear service worker and browser cache
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** → Unregister all
4. Go to **Storage** → **Clear site data**
5. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue: PM2 process not restarting

```bash
ssh -i ~/.ssh/id_ed25519 memconnadmin@160.153.184.11

# Check PM2 status
pm2 status

# Restart all
pm2 restart all

# Or restart specific app
pm2 restart memory-connector-api

# Check logs
pm2 logs memory-connector-api --lines 100
```

### Issue: 404 for new API endpoints

**Check**: Route registration in startup logs
```bash
ssh -i ~/.ssh/id_ed25519 memconnadmin@160.153.184.11
pm2 logs memory-connector-api --lines 300 | grep "Mapped.*route"
```

Look for: `Mapped {/api/v1/search/all, GET} route`

### Issue: "Address already in use" error

**Cause**: Multiple instances trying to bind to port 4000

**Solution**:
```bash
# Kill all Node processes
pm2 delete all
# Or kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Restart
pm2 restart memory-connector-api
```

## Production Server Commands

### View Logs
```bash
# Real-time logs
pm2 logs

# Last 100 lines
pm2 logs memory-connector-api --lines 100

# Error logs only
pm2 logs memory-connector-api --err

# Clear logs
pm2 flush
```

### Check Status
```bash
# PM2 process status
pm2 status

# System resources
pm2 monit

# Detailed info
pm2 describe memory-connector-api
```

### Restart Services
```bash
# Restart API
pm2 restart memory-connector-api

# Restart with zero downtime
pm2 reload memory-connector-api

# Stop/Start
pm2 stop memory-connector-api
pm2 start memory-connector-api
```

### Check API Health
```bash
# From server
curl http://localhost:4000/api/v1/health

# From anywhere
curl https://memoryconnector.com/api/v1/health
```

## Troubleshooting TypeScript Build on Production

If you want to fix the production build (optional):

```bash
ssh -i ~/.ssh/id_ed25519 memconnadmin@160.153.184.11
cd /var/www/memory-connector/apps/api

# Check TypeScript version
npx tsc --version

# Try clean build
rm -rf dist node_modules
pnpm install
pnpm run build

# Check if .js files were generated
ls -la dist/search/

# If only .d.ts files exist, the issue persists
# Continue using local builds
```

## Git Workflow with Deployment

Recommended workflow:

```bash
# 1. Make changes locally
git add .
git commit -m "feat: your changes"
git push origin main

# 2. Pull changes on server (optional - not required for deployment)
ssh -i ~/.ssh/id_ed25519 memconnadmin@160.153.184.11 'cd /var/www/memory-connector && git pull'

# 3. Deploy using script (builds locally, not on server)
./deploy.sh
```

**Note**: Since we build locally, pulling on the server is optional. The deployment script uploads the pre-built files.

## Environment Variables

Production environment variables are managed via PM2 ecosystem file:
- Location: `/var/www/memory-connector/ecosystem.config.js`
- To update: Edit file and run `pm2 restart memory-connector-api --update-env`

## Monitoring

- **Uptime**: PM2 shows uptime and restart count
- **Logs**: Available via `pm2 logs`
- **Health Check**: https://memoryconnector.com/api/v1/health
- **Swagger Docs**: https://memoryconnector.com/api/v1/docs

## Security Notes

- SSH keys are required (password auth disabled)
- SSL certificates managed by Certbot (auto-renewal enabled)
- Nginx serves as reverse proxy
- API rate limiting enabled (100 req/min for free tier)

## Contact

For deployment issues, check:
1. This guide
2. PM2 logs on server
3. Browser console (F12)
4. Network tab for API responses
