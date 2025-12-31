# Git-Based Deployment - Memory Connector

**Repository**: https://github.com/mikesamcali-dev/MemoryConnector.git
**Production Server**: 160.153.184.11
**Deploy Path**: /var/www/memory-connector

---

## Step 1: Push Local Code to GitHub (Windows)

### From Windows PowerShell:

```powershell
# Navigate to project directory
cd "C:\Visual Studio\Memory Connector"

# Check current status
git status

# Add all changes (including untracked files)
git add .

# Commit changes
git commit -m "Production deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

# Verify remote is set correctly
git remote -v
# Should show: origin  https://github.com/mikesamcali-dev/MemoryConnector.git

# If remote is not set, add it:
# git remote add origin https://github.com/mikesamcali-dev/MemoryConnector.git

# Push to GitHub (main branch)
git push origin main

# If you get authentication errors, you may need a personal access token:
# 1. Go to: https://github.com/settings/tokens
# 2. Generate new token (classic)
# 3. Select scopes: repo (all)
# 4. Copy token and use as password when prompted
```

---

## Step 2: Pull Code on Production Server (Ubuntu)

### Connect to production server:

```powershell
# From Windows PowerShell
ssh deploy@160.153.184.11
# Password: MWa#*2&k7M8sz$b6DW
```

### On Ubuntu server:

```bash
# Clean existing messy directory structure
cd /var/www
sudo rm -rf memory-connector
sudo mkdir -p memory-connector
sudo chown deploy:deploy memory-connector

# Clone repository (as deploy user)
cd /var/www/memory-connector
git clone https://github.com/mikesamcali-dev/MemoryConnector.git .

# Configure git user (for future operations)
git config user.email "deploy@memoryconnector.com"
git config user.name "Deploy User"

# Verify files are present
ls -la
# Should see: package.json, apps/, Docs/, etc.

# Install dependencies
pnpm install
```

---

## Step 3: Future Updates (Quick Reference)

### When you make changes on Windows:

```powershell
cd "C:\Visual Studio\Memory Connector"
git add .
git commit -m "Description of changes"
git push origin main
```

### To update production server:

```bash
# SSH to server
ssh deploy@160.153.184.11

# Navigate to project
cd /var/www/memory-connector

# Pull latest changes
git pull origin main

# Install any new dependencies
pnpm install

# Rebuild backend (if API changed)
cd apps/api
pnpm build

# Rebuild frontend (if web app changed)
cd ../web
pnpm build

# Restart backend
pm2 restart memory-connector-api

# Reload Nginx (if needed)
sudo systemctl reload nginx
```

---

## Troubleshooting

### Authentication Issues (GitHub)

**If git push asks for username/password repeatedly:**

1. **Use Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (all sub-scopes)
   - Copy token
   - Use token as password when prompted

2. **Or configure credential helper (Windows):**
   ```powershell
   git config --global credential.helper wincred
   ```

### Clone Failed on Ubuntu

**If clone fails with "Permission denied":**

```bash
# Make sure you're using deploy user
whoami
# Should return: deploy

# If you're root, switch to deploy
su - deploy
cd /var/www/memory-connector
```

**If repository is private:**

```bash
# Clone with authentication
git clone https://YOUR_GITHUB_USERNAME:YOUR_PERSONAL_ACCESS_TOKEN@github.com/mikesamcali-dev/MemoryConnector.git .

# Or set up SSH keys for GitHub:
# 1. Generate key: ssh-keygen -t ed25519 -C "deploy@memoryconnector"
# 2. Add to GitHub: https://github.com/settings/keys
# 3. Clone with SSH: git clone git@github.com:mikesamcali-dev/MemoryConnector.git .
```

### Merge Conflicts on Pull

```bash
# If git pull shows conflicts:

# Option 1: Discard local changes (use remote version)
git fetch origin
git reset --hard origin/main

# Option 2: Stash local changes
git stash
git pull origin main
git stash pop  # Re-apply your local changes
```

---

## Automated Deployment Script (Optional)

Create a deployment script on the server:

```bash
# On Ubuntu server, create deploy script
nano ~/deploy.sh
```

**Paste this content:**

```bash
#!/bin/bash
set -e

echo "=== Memory Connector Deployment Script ==="
echo "Starting deployment at $(date)"

# Navigate to project
cd /var/www/memory-connector

# Pull latest code
echo "Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build backend
echo "Building backend..."
cd apps/api
pnpm build

# Run migrations
echo "Running database migrations..."
pnpm prisma migrate deploy

# Build frontend
echo "Building frontend..."
cd ../web
pnpm build

# Restart backend
echo "Restarting backend..."
pm2 restart memory-connector-api

echo "Deployment completed at $(date)"
echo "=== Deployment Successful ==="
```

**Make it executable:**

```bash
chmod +x ~/deploy.sh
```

**To deploy updates, just run:**

```bash
~/deploy.sh
```

---

## Summary

1. **Windows**: `git add . && git commit -m "message" && git push origin main`
2. **Ubuntu**: `cd /var/www/memory-connector && git pull origin main && ~/deploy.sh`

---

**Created**: December 31, 2025
**Repository**: https://github.com/mikesamcali-dev/MemoryConnector.git
