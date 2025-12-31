I # GoDaddy Deployment Guide - Memory Connector

**Created**: December 23, 2025
**Application**: Memory Connector MVP
**Target**: GoDaddy Hosting

---

## ⚠️ Important: GoDaddy Hosting Limitations

Before deploying to GoDaddy, understand the hosting type requirements:

### What Memory Connector Needs

1. **Frontend**: Static file hosting (HTML, CSS, JS)
2. **Backend API**: Node.js 18+ runtime
3. **Database**: PostgreSQL 16+ with **pgvector extension** (critical!)
4. **Cache**: Redis 6+
5. **Background Worker**: Long-running Node.js process
6. **Environment**: Full control over Node.js packages and configuration

### GoDaddy Hosting Types

| Hosting Type | Frontend | Backend API | PostgreSQL + pgvector | Redis | Recommendation |
|--------------|----------|-------------|----------------------|-------|----------------|
| **Shared Hosting** | ✅ Yes | ❌ Limited | ❌ No | ❌ No | ❌ Not Suitable |
| **cPanel Hosting** | ✅ Yes | ⚠️ Limited | ❌ No | ❌ No | ⚠️ Frontend Only |
| **VPS (Unmanaged)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **Recommended** |
| **VPS (Managed)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **Best Option** |
| **Dedicated Server** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Works (Expensive) |

---

## 🎯 Recommended Deployment Strategies

### Strategy 1: Hybrid Deployment (Easiest)
**Use GoDaddy for frontend only, external services for backend**

- **Frontend**: GoDaddy cPanel or VPS
- **Backend**: Railway.app, Render.com, or DigitalOcean
- **Database**: Neon.tech (PostgreSQL with pgvector)
- **Redis**: Upstash or Redis Cloud

**Pros**: Easiest setup, managed services, auto-scaling
**Cons**: Multiple service providers
**Cost**: ~$20-40/month total

### Strategy 2: Full Stack on GoDaddy VPS (Most Control)
**Deploy entire application on a single GoDaddy VPS**

- **All Components**: Single VPS server
- **Requirements**: VPS with 4GB+ RAM, Ubuntu 22.04

**Pros**: Single provider, full control, lower cost
**Cons**: More setup, manual management
**Cost**: ~$30-80/month (depends on VPS size)

### Strategy 3: Frontend Only (Limited)
**Use GoDaddy for static files, deploy backend elsewhere**

- **Frontend**: GoDaddy hosting
- **Backend**: Any cloud provider

**Pros**: Simple frontend deployment
**Cons**: Not a complete solution
**Cost**: $5-15/month (GoDaddy) + backend costs

---

## 📋 Strategy 1: Hybrid Deployment (Recommended for Beginners)

### Step 1: Deploy Backend to Railway.app

**Why Railway?** Free tier, auto-deployment, built-in PostgreSQL + Redis

#### 1.1 Create Railway Account
```bash
# Visit https://railway.app
# Sign up with GitHub
```

#### 1.2 Install Railway CLI
```powershell
# Windows
npm install -g @railway/cli

# Login
railway login
```

#### 1.3 Initialize Railway Project
```powershell
# From project root
cd apps\api

# Initialize Railway
railway init

# Link to new project (select "Create new project")
railway link
```

#### 1.4 Add PostgreSQL and Redis
```bash
# In Railway dashboard (https://railway.app/dashboard):
# 1. Click your project
# 2. Click "+ New" → "Database" → "Add PostgreSQL"
# 3. Click "+ New" → "Database" → "Add Redis"
# 4. Wait for provisioning (~2 minutes)
```

#### 1.5 Configure Environment Variables
```bash
# In Railway dashboard:
# 1. Click your API service
# 2. Go to "Variables" tab
# 3. Add these variables:

NODE_ENV=production
PORT=4000

# Database (Railway provides this automatically as DATABASE_URL)
# Just rename it:
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway provides this)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET=<your-strong-random-string-here>
JWT_REFRESH_SECRET=<your-different-random-string-here>

# OpenAI
OPENAI_API_KEY=<your-openai-api-key>

# CORS (your GoDaddy domain)
CORS_ORIGIN=https://yourdomain.com

# Cost Management
AI_DAILY_BUDGET_CENTS=500
AI_BUDGET_ALERT_THRESHOLD=0.9

# Email Alerts (optional)
ADMIN_EMAIL=your-email@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Worker
ENRICHMENT_WORKER_ENABLED=true
ENRICHMENT_POLL_INTERVAL_MS=5000
```

**Generate JWT Secrets**:
```powershell
# Run this in PowerShell to generate secure random strings
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### 1.6 Enable pgvector Extension
```bash
# In Railway dashboard:
# 1. Click your PostgreSQL service
# 2. Click "Connect" → "Postgres Connection URL"
# 3. Copy the connection string
# 4. Use a PostgreSQL client or Railway's built-in shell

# Connect to PostgreSQL
railway run --service postgres psql $DATABASE_URL

# Run this command:
CREATE EXTENSION IF NOT EXISTS vector;

# Verify:
\dx
# Should show "vector" in the list

# Exit:
\q
```

#### 1.7 Deploy Backend
```powershell
# From apps\api directory
cd apps\api

# Build the application
pnpm build

# Deploy to Railway
railway up

# Watch deployment logs
railway logs
```

#### 1.8 Run Database Migrations
```powershell
# From apps\api directory
railway run pnpm db:migrate

# Seed initial data (optional)
railway run pnpm db:seed
```

#### 1.9 Get Backend URL
```bash
# In Railway dashboard:
# 1. Click your API service
# 2. Go to "Settings" tab
# 3. Click "Generate Domain" under "Public Networking"
# 4. Copy the URL (e.g., https://your-app.up.railway.app)
```

### Step 2: Deploy Frontend to GoDaddy

#### 2.1 Build Frontend
```powershell
# From project root
cd apps\web

# Set backend URL
# Create .env.production file:
New-Item -Path .env.production -ItemType File -Force
Set-Content -Path .env.production -Value "VITE_API_URL=https://your-app.up.railway.app"

# Build
pnpm build

# This creates apps\web\dist folder with optimized files
```

#### 2.2 Upload to GoDaddy via cPanel

**Option A: File Manager (Web Interface)**

1. **Login to cPanel**:
   - Go to https://yourdomain.com/cpanel
   - Login with your credentials

2. **Navigate to File Manager**:
   - Find "File Manager" icon
   - Click to open

3. **Go to public_html**:
   - Navigate to `public_html` folder (or `public_html/subdomain` if using subdomain)
   - This is your web root

4. **Clear existing files** (if any):
   - Select all files in public_html
   - Click "Delete"

5. **Upload frontend files**:
   - Click "Upload" button
   - Drag and drop all files from `apps\web\dist` folder
   - **IMPORTANT**: Upload the CONTENTS of dist, not the dist folder itself
   - Wait for upload to complete

6. **Set correct permissions**:
   - Select all uploaded files
   - Click "Permissions"
   - Set to 644 for files, 755 for folders

**Option B: FTP Upload (Recommended for Large Sites)**

1. **Get FTP Credentials**:
   - In cPanel, go to "FTP Accounts"
   - Use main account or create new FTP account
   - Note: Host, Username, Password

2. **Install FTP Client**:
   ```powershell
   # Install FileZilla
   # Download from: https://filezilla-project.org/download.php?type=client
   ```

3. **Connect via FTP**:
   - Host: ftp.yourdomain.com (or your GoDaddy server)
   - Username: your-username@yourdomain.com
   - Password: your-password
   - Port: 21

4. **Upload Files**:
   - Navigate to `/public_html` on remote side
   - Navigate to `C:\Visual Studio\Memory Connector\apps\web\dist` on local side
   - Select all files inside dist (not the dist folder)
   - Drag to remote side
   - Wait for upload

**Option C: Command Line (Git Deployment)**

If your GoDaddy hosting supports SSH:

```bash
# Connect via SSH
ssh username@yourdomain.com

# Navigate to web root
cd public_html

# Clone your repository (if using Git)
git clone https://github.com/yourusername/memory-connector.git temp
cd temp/apps/web

# Install dependencies and build
npm install
npm run build

# Move build files
mv dist/* ../../
cd ../../
rm -rf temp

# Set permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
```

#### 2.3 Configure .htaccess for React Router

Create a `.htaccess` file in `public_html`:

```apache
# Create this file in GoDaddy File Manager
# Go to public_html → click "+ File" → name it ".htaccess"

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirect HTTP to HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Handle React Router
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "DENY"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

#### 2.4 Test Deployment

1. **Visit your site**: https://yourdomain.com
2. **Test login**: Use test@example.com / password123
3. **Check browser console**: Look for API connection errors
4. **Verify API calls**: Should go to Railway backend

---

## 📋 Strategy 2: Full Stack on GoDaddy VPS

**Prerequisites**: GoDaddy VPS with Ubuntu 22.04, 4GB+ RAM

### Step 1: Initial VPS Setup

#### 1.1 Connect to VPS via SSH
```bash
# Get your VPS IP from GoDaddy dashboard
# Connect via SSH (use PuTTY on Windows or built-in SSH)
ssh root@your-vps-ip
```

#### 1.2 Create Non-Root User
```bash
# Create deployment user
adduser deploy
usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

#### 1.3 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Dependencies

#### 2.1 Install Node.js 18
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be v18.x
npm --version
```

#### 2.2 Install pnpm
```bash
sudo npm install -g pnpm
pnpm --version
```

#### 2.3 Install PostgreSQL 16
```bash
# Add PostgreSQL repository
sudo apt install -y wget ca-certificates
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# Install PostgreSQL 16
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
sudo systemctl status postgresql
```

#### 2.4 Install pgvector Extension
```bash
# Install build dependencies
sudo apt install -y build-essential postgresql-server-dev-16

# Clone and build pgvector
cd /tmp
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install

# Verify
sudo -u postgres psql -c "CREATE EXTENSION vector;" postgres
```

#### 2.5 Install Redis
```bash
sudo apt install -y redis-server

# Configure Redis
sudo sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf

# Start Redis
sudo systemctl restart redis
sudo systemctl enable redis

# Verify
redis-cli ping  # Should return "PONG"
```

#### 2.6 Install Nginx (Web Server)
```bash
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 2.7 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

#### 2.8 Install Certbot (SSL Certificates)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 3: Configure Database

#### 3.1 Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# Run these commands in PostgreSQL:
CREATE DATABASE memory_connector;
CREATE USER memory_user WITH ENCRYPTED PASSWORD 'your-strong-password-here';
GRANT ALL PRIVILEGES ON DATABASE memory_connector TO memory_user;

# Connect to database
\c memory_connector

# Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

# Verify
\dx

# Exit
\q
```

#### 3.2 Configure PostgreSQL for Remote Access (if needed)
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf

# Find and change:
listen_addresses = 'localhost'  # Keep as localhost for security

# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add this line (after existing lines):
local   all             memory_user                             scram-sha-256

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 4: Deploy Backend Application

#### 4.1 Clone Repository
```bash
# Create app directory
sudo mkdir -p /var/www/memory-connector
sudo chown deploy:deploy /var/www/memory-connector
cd /var/www/memory-connector

# Clone your repository (if using Git)
git clone https://github.com/yourusername/memory-connector.git .

# Or upload files via SCP from your local machine:
# From your Windows machine in PowerShell:
# scp -r "C:\Visual Studio\Memory Connector\*" deploy@your-vps-ip:/var/www/memory-connector/
```

#### 4.2 Install Dependencies
```bash
cd /var/www/memory-connector

# Install dependencies
pnpm install
```

#### 4.3 Configure Environment Variables
```bash
# Create .env file
nano apps/api/.env

# Paste this configuration (update values):
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL="postgresql://memory_user:your-strong-password-here@localhost:5432/memory_connector?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_ACCESS_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-different-generated-secret-here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# CORS
CORS_ORIGIN=https://yourdomain.com

# AI Cost Management
AI_DAILY_BUDGET_CENTS=500
AI_BUDGET_ALERT_THRESHOLD=0.9

# Email (optional)
ADMIN_EMAIL=your-email@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Worker
ENRICHMENT_WORKER_ENABLED=true
ENRICHMENT_POLL_INTERVAL_MS=5000

# Logging
LOG_LEVEL=info

# Save and exit (Ctrl+X, Y, Enter)
```

**Generate JWT Secrets on the server**:
```bash
# Generate secrets
openssl rand -base64 64
# Copy output and paste into JWT_ACCESS_SECRET

openssl rand -base64 64
# Copy output and paste into JWT_REFRESH_SECRET
```

#### 4.4 Build Backend
```bash
cd apps/api
pnpm build
```

#### 4.5 Run Migrations
```bash
cd /var/www/memory-connector/apps/api
pnpm db:generate
pnpm db:migrate
pnpm db:seed  # Optional: adds test user
```

#### 4.6 Start Backend with PM2
```bash
# Create PM2 ecosystem file
cd /var/www/memory-connector
nano ecosystem.config.js

# Paste this configuration:
```

```javascript
module.exports = {
  apps: [
    {
      name: 'memory-connector-api',
      cwd: '/var/www/memory-connector/apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/memory-connector/api-error.log',
      out_file: '/var/log/memory-connector/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
```

```bash
# Save and exit

# Create log directory
sudo mkdir -p /var/log/memory-connector
sudo chown deploy:deploy /var/log/memory-connector

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it prints (run the command it gives you with sudo)

# Check status
pm2 status
pm2 logs memory-connector-api
```

### Step 5: Deploy Frontend

#### 5.1 Build Frontend
```bash
cd /var/www/memory-connector/apps/web

# Create production environment file
nano .env.production

# Add:
VITE_API_URL=https://yourdomain.com/api

# Save and exit

# Build
pnpm build
```

#### 5.2 Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/memory-connector

# Paste this configuration:
```

```nginx
# Backend API Server
upstream api_backend {
    server localhost:4000;
    keepalive 64;
}

# HTTP Server (Redirect to HTTPS)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React App)
    root /var/www/memory-connector/apps/web/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API Proxy
    location /api/v1 {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Idempotency-Key' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Frontend Static Files
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
}
```

```bash
# Save and exit

# Enable site
sudo ln -s /etc/nginx/sites-available/memory-connector /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### Step 6: Setup SSL Certificate

#### 6.1 Install SSL Certificate with Certbot
```bash
# Make sure your domain DNS points to your VPS IP first!

# Create directory for Let's Encrypt challenges
sudo mkdir -p /var/www/certbot

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to share email with EFF
# - Certbot will automatically configure Nginx

# Test auto-renewal
sudo certbot renew --dry-run
```

#### 6.2 Configure Auto-Renewal
```bash
# Certbot auto-renewal is already set up via systemd timer
# Verify it's enabled:
sudo systemctl status certbot.timer

# You can also add a cron job as backup:
sudo crontab -e

# Add this line:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Step 7: Configure Firewall

```bash
# Install UFW (if not already installed)
sudo apt install -y ufw

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 8: Setup Monitoring and Logs

#### 8.1 View Logs
```bash
# PM2 logs (backend)
pm2 logs memory-connector-api

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

#### 8.2 Setup Log Rotation
```bash
# PM2 log rotation (already handled by PM2)
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Step 9: Test Deployment

```bash
# Test backend directly
curl http://localhost:4000/api/v1/health

# Test through Nginx
curl https://yourdomain.com/api/v1/health

# Check PM2 status
pm2 status

# Check all services
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis
```

### Step 10: Regular Maintenance

#### Database Backups
```bash
# Create backup script
nano /home/deploy/backup-db.sh

# Paste:
```

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U memory_user -h localhost memory_connector | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x /home/deploy/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/deploy/backup-db.sh
```

#### Updates
```bash
# Update application
cd /var/www/memory-connector
git pull  # If using Git

# Rebuild
cd apps/api
pnpm install
pnpm build

cd ../web
pnpm install
pnpm build

# Restart
pm2 restart memory-connector-api
```

---

## 🔧 Troubleshooting

### Backend Not Starting
```bash
# Check PM2 logs
pm2 logs memory-connector-api --lines 100

# Check environment variables
cd /var/www/memory-connector/apps/api
cat .env

# Test database connection
psql -U memory_user -h localhost -d memory_connector -c "SELECT 1;"

# Check if port is in use
sudo netstat -tulpn | grep 4000
```

### Frontend Not Loading
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t

# Check file permissions
ls -la /var/www/memory-connector/apps/web/dist

# Verify .env.production
cat /var/www/memory-connector/apps/web/.env.production
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U memory_user -h localhost -d memory_connector

# Check logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Verify pgvector
sudo -u postgres psql -d memory_connector -c "\dx"
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

---

## 💰 Cost Estimate

### GoDaddy VPS Pricing (as of 2025)
- **VPS 1GB**: ~$20/month (too small, not recommended)
- **VPS 2GB**: ~$30/month (minimum for light usage)
- **VPS 4GB**: ~$50/month (recommended for production)
- **VPS 8GB**: ~$80/month (for heavy usage)

### Additional Costs
- Domain: ~$12-20/year
- SSL Certificate: FREE (Let's Encrypt)
- Backups: Included with VPS
- OpenAI API: Pay-as-you-go (~$5-50/month depending on usage)

**Total Monthly Cost**: $50-100/month for production-ready setup

---

## ✅ Post-Deployment Checklist

- [ ] Backend running on PM2
- [ ] Frontend accessible via domain
- [ ] SSL certificate installed and auto-renewing
- [ ] Database migrations completed
- [ ] pgvector extension enabled
- [ ] Redis cache working
- [ ] API health check returns 200
- [ ] Login functionality works
- [ ] Memory creation works
- [ ] Search functionality works
- [ ] Offline sync works
- [ ] Environment variables secured
- [ ] Firewall configured
- [ ] Database backups scheduled
- [ ] Monitoring set up
- [ ] DNS pointing to VPS IP
- [ ] Email alerts configured (optional)

---

## 🚀 Quick Commands Reference

```bash
# Check all services
pm2 status
sudo systemctl status nginx postgresql redis

# Restart services
pm2 restart memory-connector-api
sudo systemctl restart nginx

# View logs
pm2 logs memory-connector-api
sudo tail -f /var/log/nginx/error.log

# Update application
cd /var/www/memory-connector && git pull
cd apps/api && pnpm install && pnpm build
pm2 restart memory-connector-api

# Database backup
pg_dump -U memory_user memory_connector | gzip > backup.sql.gz

# Test API
curl https://yourdomain.com/api/v1/health
```

---

**Deployment Complete!** 🎉

Your Memory Connector application is now running on GoDaddy VPS with full SSL, monitoring, and automated backups.

For support, check logs first, then refer to the troubleshooting section above.
