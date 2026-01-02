# GitHub Deployment Workflow

## Overview
This guide covers how to push local changes to GitHub and deploy them to your Ubuntu production server.

---

## 📤 Part 1: Push Changes to GitHub

### Step 1: Check Current Status

```bash
cd "C:\Visual Studio\Memory Connector"
git status
```

This will show you all modified files. You should see:
- `apps/api/src/audit-trail/interceptors/audit-logging.interceptor.ts` (modified)
- `apps/web/src/pages/YouTubeBuilderPage.tsx` (modified)
- `DEPLOYMENT_2025-12-31.md` (new file)
- `GITHUB_DEPLOYMENT_WORKFLOW.md` (new file)

### Step 2: Review Changes

```bash
# Review what changed in each file
git diff apps/api/src/audit-trail/interceptors/audit-logging.interceptor.ts
git diff apps/web/src/pages/YouTubeBuilderPage.tsx
```

### Step 3: Stage Your Changes

```bash
# Add the specific files
git add apps/api/src/audit-trail/interceptors/audit-logging.interceptor.ts
git add apps/web/src/pages/YouTubeBuilderPage.tsx
git add DEPLOYMENT_2025-12-31.md
git add GITHUB_DEPLOYMENT_WORKFLOW.md

# Or add all changes at once
git add .
```

### Step 4: Commit Your Changes

```bash
git commit -m "fix: resolve audit logging circular reference error and improve YouTube page UX

- Fix 500 errors caused by circular reference in audit logging interceptor
- Add try-catch block to handle JSON.stringify errors gracefully
- Make YouTube video form always visible (remove toggle button)
- Replace Cancel button with Clear button for better UX
- Add deployment documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Step 5: Push to GitHub

```bash
# Push to main branch
git push origin main

# If you get an error about upstream, use:
git push -u origin main
```

### Step 6: Verify on GitHub

1. Open your browser and go to your GitHub repository
2. Navigate to the repository (e.g., `https://github.com/yourusername/memory-connector`)
3. Verify the commit appears in the commit history
4. Check that the files were updated correctly

---

## 📥 Part 2: Deploy to Ubuntu Production Server

### Step 1: Connect to Your Production Server

```bash
# SSH into your Ubuntu server
ssh username@your-server-ip-or-domain

# Or if using a specific SSH key:
ssh -i /path/to/your-key.pem username@your-server-ip-or-domain

# Or if using a specific port:
ssh -p 22 username@your-server-ip-or-domain
```

> **Note:** Replace `username` and `your-server-ip-or-domain` with your actual credentials.

### Step 2: Navigate to Your Application Directory

```bash
# Navigate to where your app is deployed
cd /var/www/memory-connector
```

### Step 3: Check Current Status

```bash
# Check which branch you're on
git branch

# Check for any uncommitted changes
git status

# View current commit
git log --oneline -5
```
  redis-cli -a 'EC8KYwAkq/SMT0SjIkNY3QnPTjy/mhKR5hJvEtrdTvE=' ping


### Step 4: Backup Current State (Safety First!)

```bash
# Create a backup of the current deployment
cd ..
tar -czf memory-connector-backup-$(date +%Y%m%d-%H%M%S).tar.gz memory-connector/

# Or just note the current commit hash for easy rollback
cd memory-connector
git rev-parse HEAD > last-deployment.txt
```

### Step 5: Pull Latest Changes from GitHub

```bash
# Make sure you're in the app directory
cd /var/www/memory-connector

# Fetch the latest changes
git fetch origin

# Pull the changes from main branch
git pull origin main
```

If you get merge conflicts or errors:
```bash
# If you have local changes that conflict, you can stash them:
git stash

# Then pull again:
git pull origin main

# To see what was stashed (if you need it):
git stash list
```

### Step 6: Verify Files Were Updated

```bash
# Check that the files were updated
ls -la apps/api/src/audit-trail/interceptors/audit-logging.interceptor.ts
ls -la apps/web/src/pages/YouTubeBuilderPage.tsx

# View the latest commit
git log --oneline -1
```

---

## 🔨 Part 3: Build and Deploy the Changes

### Step 1: Install/Update Dependencies

```bash
# Install any new dependencies (if package.json changed)
pnpm install

# Or if you don't have pnpm on the server:
npm install
```

### Step 2: Build the Backend (API)

```bash
# Navigate to API directory
cd apps/api

# Build the TypeScript code
pnpm build

# Or with npm:
npm run build

# Verify the build succeeded
ls -la dist/
```

### Step 3: Build the Frontend (Web)

```bash
# Navigate to web directory
cd ../web

# Build the React application
pnpm build

# Or with npm:
npm run build

# Verify the build succeeded
ls -la dist/
```

### Step 4: Restart the Backend Service

Choose the method based on how your server is configured:

#### Option A: Using PM2 (Most Common)

```bash
# Go back to root directory
cd ../..

# Restart the API
pm2 restart memory-connector-api

# Or restart by ID:
pm2 list  # Find the ID
pm2 restart <id>

# Check logs to verify it started correctly
pm2 logs memory-connector-api --lines 50
```

#### Option B: Using systemd

```bash
# Restart the service
sudo systemctl restart memory-connector-api

# Check status
sudo systemctl status memory-connector-api

# View logs
sudo journalctl -u memory-connector-api -n 50 -f
```

#### Option C: Using Docker

```bash
# If using Docker Compose
docker-compose restart api

# Or rebuild and restart
docker-compose up -d --build api
```

#### Option D: Manual Process (if running node directly)

```bash
# Find the process
ps aux | grep node

# Kill the old process
kill <process-id>

# Start the new process
cd apps/api
nohup node dist/main.js > ../../logs/api.log 2>&1 &
```

### Step 5: Deploy Frontend Files

The frontend deployment depends on your GoDaddy setup:

#### Option A: If using Node.js to serve frontend

```bash
# Frontend might be served by a separate process
pm2 restart memory-connector-web
```

#### Option B: If serving static files via Nginx/Apache

```bash
# Copy to your web root (adjust path based on your web server config)
cp -r apps/web/dist/* /var/www/memory-connector/public/

# Or if serving from a different location:
rsync -av --delete apps/web/dist/ /var/www/html/memory-connector/
```

---

## ✅ Part 4: Verify Deployment

### Step 1: Check API Health

```bash
# From your production server
curl http://localhost:4000/api/v1/health

# Or from your local machine
curl https://your-domain.com/api/v1/health
```

Expected response: `200 OK`

### Step 2: Check API Logs

```bash
# Using PM2
pm2 logs memory-connector-api --lines 100

# Using systemd
sudo journalctl -u memory-connector-api -n 100 -f

# Or check log file
tail -f logs/api.log
```

**Look for:**
- ✅ "Nest application successfully started"
- ✅ "Application is running on: http://localhost:4000"
- ❌ No error messages or crashes

### Step 3: Test the Fixed Endpoints

```bash
# Test login endpoint (should return 200, not 500)
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test reminders endpoint (requires authentication)
# First get a token from login, then:
curl -X GET https://your-domain.com/api/v1/reminders/upcoming \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 4: Check Frontend in Browser

1. Open your browser
2. Go to `https://your-domain.com`
3. **Clear cache:** Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
   - Select "Cached images and files"
   - Click "Clear data"
4. **Hard refresh:** Press `Ctrl+F5` (or `Cmd+Shift+R` on Mac)
5. Navigate to YouTube Videos page (`/app/youtube-videos`)
6. **Verify:**
   - ✅ Form is visible without clicking button
   - ✅ Can add a YouTube video
   - ✅ No console errors
7. Navigate to Capture page
8. **Verify:**
   - ✅ Reminders load without errors
   - ✅ No 500 errors in Network tab

### Step 5: Monitor for Issues

```bash
# Keep logs running for a few minutes
pm2 logs memory-connector-api --lines 0

# Watch for:
# - Any 500 errors
# - Any circular reference errors
# - Any crashes
```

---

## 🔄 Rollback Procedure (If Needed)

If something goes wrong, you can quickly rollback:

### Option 1: Rollback to Previous Commit

```bash
# SSH into production server
ssh username@your-server-ip

# Navigate to app directory
cd /var/www/memory-connector

# Find the previous commit
git log --oneline -5

# Rollback to previous commit
git reset --hard HEAD~1

# Or rollback to a specific commit:
git reset --hard <commit-hash>

# Rebuild and restart
cd apps/api && pnpm build
cd ../web && pnpm build
pm2 restart memory-connector-api

# Re-deploy frontend files (if applicable)
cp -r apps/web/dist/* /var/www/memory-connector/public/
```

### Option 2: Restore from Backup

```bash
# Find your backup
ls -lh memory-connector-backup-*.tar.gz

# Extract the backup
tar -xzf memory-connector-backup-20251231-120000.tar.gz

# Restart services
pm2 restart all
```

---

## 📋 Quick Reference Commands

### Local Development (Windows)
```bash
git status                    # Check changes
git add .                     # Stage all changes
git commit -m "message"       # Commit changes
git push origin main          # Push to GitHub
```

### Production Server (Ubuntu)
```bash
ssh user@server               # Connect to server
cd /var/www/memory-connector  # Navigate to app
git pull origin main          # Pull changes
pnpm install                  # Install dependencies
pnpm build                    # Build (in apps/api and apps/web)
pm2 restart app-name          # Restart service
pm2 logs app-name             # Check logs
```

### Common Ubuntu Server Paths
- Application: `/var/www/memory-connector/`
- Web Root: `/var/www/html/` or `/var/www/memory-connector/public/`
- Logs: `/var/log/` or `/var/www/memory-connector/logs/`
- Nginx Config: `/etc/nginx/sites-available/`

---

## 🔐 Ubuntu Server SSH Connection Info

### Connection Details:

1. **Server Information:**
   - **Server:** Your server IP address or domain name
   - **Port:** Usually `22` (default SSH port)
   - **Username:** Your Ubuntu user (often `root` or `ubuntu`)
   - **Authentication:** SSH key (recommended) or password

2. **Common Connection Strings:**
   ```bash
   # Standard connection
   ssh username@your-server-ip

   # With SSH key
   ssh -i ~/.ssh/your-key.pem username@your-server-ip

   # With domain name
   ssh username@yourdomain.com
   ```

### First Time Setup:

If this is your first time deploying:

```bash
# 1. SSH into server
ssh user@server

# 2. Navigate to web root
cd /var/www

# 3. Clone repository
sudo git clone https://github.com/yourusername/memory-connector.git
sudo chown -R $USER:$USER memory-connector

# 4. Install dependencies
cd memory-connector
pnpm install

# 5. Setup environment variables
cp .env.example .env
nano .env  # Edit with your production values

# 6. Build
cd apps/api && pnpm build
cd ../web && pnpm build

# 7. Start with PM2
cd ../..
pm2 start apps/api/dist/main.js --name memory-connector-api
pm2 startup  # Enable auto-start
pm2 save  # Save current process list
```

---

## 💡 Tips & Best Practices

1. **Always test locally first** before pushing to production
2. **Create backups** before pulling changes
3. **Monitor logs** for at least 5-10 minutes after deployment
4. **Deploy during low-traffic hours** if possible
5. **Keep a rollback plan ready** (note the current commit hash)
6. **Use branches** for major changes, only push to main when tested
7. **Document any manual steps** needed for deployment

---

## 🆘 Troubleshooting

### Problem: "Permission denied (publickey)"
**Solution:**
```bash
# Add your SSH key to the server
ssh-copy-id username@server

# Or use password authentication
ssh -o PreferredAuthentications=password username@server
```

### Problem: "Port 4000 already in use"
**Solution:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or using pm2
pm2 delete memory-connector-api
pm2 start apps/api/dist/main.js --name memory-connector-api
```

### Problem: "pnpm: command not found"
**Solution:**
```bash
# Install pnpm globally
npm install -g pnpm

# Or use npm instead
npm install
npm run build
```

### Problem: Frontend changes not showing
**Solution:**
```bash
# Clear browser cache completely
# In browser: Ctrl+Shift+Delete -> Clear all cached files

# On server, verify files were copied correctly
ls -la /var/www/memory-connector/public/
ls -la apps/web/dist/

# Recopy files
cp -r apps/web/dist/* /var/www/memory-connector/public/
```

### Problem: Git pull conflicts
**Solution:**
```bash
# Stash local changes
git stash

# Pull again
git pull origin main

# If you want to keep local changes
git stash pop

# If you want to discard local changes
git reset --hard origin/main
```

---

## 📞 Support Checklist

Before asking for help, check:

- [ ] Can you SSH into the server?
- [ ] Did `git pull` succeed?
- [ ] Did the build complete without errors?
- [ ] Is the service running? (`pm2 list` or `ps aux | grep node`)
- [ ] Are there errors in the logs?
- [ ] Did you clear your browser cache?
- [ ] Can you access the health endpoint?

---

**Last Updated:** December 31, 2025
**Next Review:** After successful deployment
