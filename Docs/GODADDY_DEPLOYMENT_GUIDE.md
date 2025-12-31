# GoDaddy VPS Production Deployment Guide - Memory Connector

**Created**: December 31, 2025
**Updated**: December 31, 2025
**Application**: Memory Connector MVP
**Target**: GoDaddy VPS (Ubuntu 22.04)
**Deployment Type**: Full Stack Production

---

## 📋 Overview

This guide provides step-by-step instructions for deploying Memory Connector to a GoDaddy VPS for **production use**. All components (frontend, backend, database, cache) run on a single VPS server.

### What You'll Deploy

- **Frontend**: React SPA served via Nginx
- **Backend API**: NestJS application managed by PM2
- **Database**: PostgreSQL 16 with pgvector extension
- **Cache**: Redis 6+
- **Web Server**: Nginx with SSL/TLS (Let's Encrypt)
- **Process Manager**: PM2 for application lifecycle

---

## ⚠️ Prerequisites

Before starting, ensure you have:

### GoDaddy VPS Requirements
- **VPS Plan**: 4GB RAM minimum (8GB recommended for production)
- **OS**: Ubuntu 22.04 LTS
- **Root Access**: SSH access with root or sudo privileges
- **Static IP**: Assigned by GoDaddy (check VPS dashboard)

### Domain Setup
- **Domain Name**: Purchased and configured (e.g., memoryconnector.com)
- **DNS Configuration**: A records pointing to VPS IP
  - `A` record: `@` → Your VPS IP (e.g., 123.45.67.89)
  - `A` record: `www` → Your VPS IP (e.g., 123.45.67.89)
- **DNS Propagation**: Wait 1-24 hours after DNS changes

### Required Credentials
- **OpenAI API Key**: Get from https://platform.openai.com/api-keys
- **Database Password**: Generate strong password (20+ characters)
- **JWT Secrets**: Will generate during setup
- **Email SMTP** (Optional): Gmail app password or SMTP service

### Local Development Machine
- **Windows PC**: PowerShell access
- **Git Installed**: For code repository
- **SSH Client**: Built-in Windows SSH or PuTTY

---

## 🔐 Pre-Deployment Security Checklist

Before proceeding, complete these security preparations:

- [ ] Change default SSH port (optional but recommended)
- [ ] Disable root SSH login
- [ ] Setup SSH key authentication
- [ ] Configure UFW firewall
- [ ] Generate strong passwords for all services
- [ ] Document all credentials in secure password manager

---

## 🚀 Deployment Steps

### Step 1: Initial VPS Setup

#### 1.1 Connect to VPS via SSH

u: memconnadmin
p: e8Fm#LV#s8aUG%dtx5
**From Windows PowerShell:**
```powershell
# Get your VPS IP from GoDaddy VPS dashboard
# Replace YOUR_VPS_IP with actual IP (e.g., 123.45.67.89)
 ssh memconnadmin@160.153.184.11

# Enter password when prompted
```

**First Login Security:**
```bash
# Update package lists
apt update

# Upgrade all packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential software-properties-common
```

#### 1.2 Create Non-Root Deployment User

**Create user:**
```bash
# Create user 'deploy' with home directory
adduser deploy

p: MWa#*2&k7M8sz$b6DW
# Follow prompts:
# - Password: [Enter strong password - save in password manager]
# - Full Name: Deploy User
# - Room Number: [Leave blank]
# - Work Phone: [Leave blank]
# - Home Phone: [Leave blank]
# - Other: [Leave blank]

# Add deploy user to sudo group
usermod -aG sudo deploy

# Verify sudo access
sudo -l -U deploy
```

**Setup SSH key authentication (Recommended):**

**Step 1: Generate SSH key on Windows (if you don't have one)**
```powershell
# In PowerShell on your Windows machine:
# Check if you already have an SSH key
Test-Path $env:USERPROFILE\.ssh\id_ed25519.pub

# If it returns False, generate a new key:
ssh-keygen -t ed25519 -C "deploy@memoryconnector"
# Press Enter to accept default location: /root/.ssh/id_ed25519
# Enter a passphrase (recommended) or press Enter for no passphrase
# Press Enter again to confirm
```

**Step 2: Copy public key to Ubuntu server**

**Method A: Using ssh-copy-id (if available on Windows)**
```powershell
# This is the easiest method if ssh-copy-id is installed
ssh-copy-id -i $env:USERPROFILE\.ssh\id_ed25519.pub deploy@160.153.184.11
# Enter deploy user password: MWa#*2&k7M8sz$b6DW
```

**Method B: Manual copy via PowerShell (works on all Windows)**
```powershell
# Read the public key content
$pubKey = Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub

# Display it (you'll copy this in next step)
Write-Output $pubKey

# SSH into the Ubuntu server as deploy user
ssh deploy@160.153.184.11
# Password: MWa#*2&k7M8sz$b6DW
```

**On Ubuntu server (after logging in as deploy):**
```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh

# Create or append to authorized_keys file
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions (critical for SSH to work)
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Verify the key was added
cat ~/.ssh/authorized_keys

# Exit back to Windows
exit
```

**Method C: Using SCP (alternative)**
```powershell
# From Windows PowerShell:
# Copy public key to Ubuntu server's tmp directory
scp $env:USERPROFILE\.ssh\id_ed25519.pub deploy@160.153.184.11:/tmp/
# Password: MWa#*2&k7M8sz$b6DW

# SSH into Ubuntu server
ssh deploy@160.153.184.11
```

**On Ubuntu server:**
```bash
# Move key to proper location
mkdir -p ~/.ssh
cat /tmp/id_ed25519.pub >> ~/.ssh/authorized_keys

# Set permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Remove temporary file
rm /tmp/id_ed25519.pub

# Verify
cat ~/.ssh/authorized_keys

# Exit
exit
```

**Step 3: Test SSH key authentication**
```powershell
# From Windows PowerShell:
ssh deploy@160.153.184.11
# Should login without password (or ask for SSH key passphrase if you set one)
# If successful, you'll be logged into the Ubuntu server as deploy user
```

#### 1.3 Harden SSH Security

```bash
# Backup SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Find and modify these lines:
# PermitRootLogin no                    # Disable root login
# PasswordAuthentication no             # Disable password auth (only after SSH key setup!)
# PubkeyAuthentication yes              # Enable key-based auth
# Port 22                               # Optional: Change to custom port (e.g., 2222)

# Save and exit: Ctrl+X, Y, Enter

# Restart SSH service
sudo systemctl restart sshd

# IMPORTANT: Keep current session open and test new connection in another window
# From Windows PowerShell:
ssh deploy@YOUR_VPS_IP
```

**Switch to deploy user for remaining steps:**
```bash
su - deploy
```

---

### Step 2: Install System Dependencies

#### 2.1 Install Node.js 18

```bash
# Add Node.js 18.x repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
# Expected output: v18.x.x

npm --version
# Expected output: 9.x.x or higher
```

#### 2.2 Install pnpm Package Manager

```bash
# Install pnpm globally
sudo npm install -g pnpm

# Verify installation
pnpm --version
# Expected output: 8.x.x or higher
```

#### 2.3 Install PostgreSQL 16

```bash
# Install required packages
sudo apt install -y wget ca-certificates gnupg

# Add PostgreSQL GPG key
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg

# Add PostgreSQL repository
echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# Update package lists
sudo apt update

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
# Expected: Active (running)

# Check PostgreSQL version
sudo -u postgres psql --version
# Expected: psql (PostgreSQL) 16.x
```

#### 2.4 Install pgvector Extension

```bash
# Install build dependencies
sudo apt install -y build-essential postgresql-server-dev-16 git

# Clone pgvector repository
cd /tmp
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector

# Compile pgvector
make

# Install extension
sudo make install

# Clean up
cd ~
rm -rf /tmp/pgvector

# Verify installation
sudo -u postgres psql -c "SELECT 1;" postgres
# Expected: Returns 1
```

#### 2.5 Install Redis

```bash
# Install Redis server
sudo apt install -y redis-server

# Configure Redis to use systemd
sudo sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf

# Configure Redis persistence (append-only file)
sudo sed -i 's/^appendonly no/appendonly yes/' /etc/redis/redis.conf

# Set Redis password (IMPORTANT for production)
# Generate random password
REDIS_PASSWORD=$(openssl rand -base64 32)
echo "Redis Password: $REDIS_PASSWORD" >> ~/credentials.txt
# Use | delimiter to avoid conflicts with special characters in password
sudo sed -i "s|^# requirepass foobared|requirepass $REDIS_PASSWORD|" /etc/redis/redis.conf

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Verify Redis is running
sudo systemctl status redis-server
# Expected: Active (running)

# Test Redis connection
redis-cli -a "$REDIS_PASSWORD" ping
# Expected: PONG
```

#### 2.6 Install Nginx Web Server

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
# Expected: Active (running)

# Check Nginx version
nginx -v
# Expected: nginx/1.x.x
```

#### 2.7 Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
# Expected: 5.x.x or higher
```

#### 2.8 Install Certbot for SSL Certificates

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
# Expected: certbot 1.x.x or higher
```

---

### Step 3: Configure PostgreSQL Database

#### 3.1 Create Database and User

```bash
# Generate strong database password
DB_PASSWORD=$(openssl rand -base64 32)
echo "PostgreSQL Password for memory_user: $DB_PASSWORD" >> ~/credentials.txt
echo "SAVE THIS PASSWORD - You'll need it for .env configuration"
cat ~/credentials.txt

# Switch to postgres user and create database
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE memory_connector;

-- Create user with password (use generated password)
CREATE USER memory_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE memory_connector TO memory_user;

-- Grant schema privileges
\c memory_connector
GRANT ALL ON SCHEMA public TO memory_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO memory_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO memory_user;

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension
\dx

-- Exit
\q
EOF

# Expected output should show:
# - CREATE DATABASE
# - CREATE ROLE
# - GRANT
# - Extension "vector" listed in \dx output
```

#### 3.2 Secure PostgreSQL Configuration

```bash
# Backup PostgreSQL configuration
sudo cp /etc/postgresql/16/main/postgresql.conf /etc/postgresql/16/main/postgresql.conf.backup
sudo cp /etc/postgresql/16/main/pg_hba.conf /etc/postgresql/16/main/pg_hba.conf.backup

# Configure PostgreSQL to listen only on localhost (security)
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/16/main/postgresql.conf

# Configure connection settings for performance
sudo bash -c 'cat >> /etc/postgresql/16/main/postgresql.conf << EOF

# Memory Connector Production Settings
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
EOF'

# Configure authentication
sudo bash -c 'cat >> /etc/postgresql/16/main/pg_hba.conf << EOF

# Memory Connector Application
local   memory_connector    memory_user                             scram-sha-256
host    memory_connector    memory_user     127.0.0.1/32            scram-sha-256
host    memory_connector    memory_user     ::1/128                 scram-sha-256
EOF'

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql

# Verify connection with memory_user
PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d memory_connector -c "SELECT version();"
# Expected: PostgreSQL version information
```
  ALTER USER memory_user WITH ENCRYPTED PASSWORD '9dcpJ!vwkkhNv7ZRLE';

    ALTER USER memory_user WITH ENCRYPTED PASSWORD '9dcpJ!vwkkhNv7ZRLE';
  DB_PASSWORD='9dcpJ!vwkkhNv7ZRLE'
---

### Step 4: Deploy Backend Application

#### 4.1 Prepare Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/memory-connector
sudo chown deploy:deploy /var/www/memory-connector

# Navigate to directory
cd /var/www/memory-connector
```

#### 4.2 Upload Application Code

**Option A: Using Git (Recommended)**
```bash
# If code is in GitHub/GitLab repository
git clone https://github.com/YOUR_USERNAME/memory-connector.git .

# Or if using private repository with SSH key
git clone git@github.com:YOUR_USERNAME/memory-connector.git .
```

**Option B: Using SCP from Windows**
```powershell
# From Windows PowerShell (on your local machine)
# Navigate to project directory
cd "C:\Visual Studio\Memory Connector"

# Upload entire project to VPS
scp -r * memconnadmin@160.153.184.11:/var/www/memory-connector/

# On Ubuntu server, allow memconnadmin to write to the directory
sudo chown -R memconnadmin:memconnadmin /var/www/memory-connector

# This may take several minutes depending on project size
```

**Option C: Using rsync (More efficient for updates)**
```powershell
# From Windows PowerShell with WSL or Git Bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  "C:\Visual Studio\Memory Connector/" \
  deploy@YOUR_VPS_IP:/var/www/memory-connector/
```

#### 4.3 Install Application Dependencies

```bash
# Navigate to project root
cd /var/www/memory-connector

# Install all dependencies (root workspace + apps)
pnpm install

# Expected: Installation of all packages may take 5-10 minutes
# Verify installation
ls node_modules/
ls apps/api/node_modules/
ls apps/web/node_modules/
```

#### 4.4 Configure Environment Variables

```bash
# Generate JWT secrets
JWT_ACCESS_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# Save credentials
echo "JWT Access Secret: $JWT_ACCESS_SECRET" >> ~/credentials.txt
echo "JWT Refresh Secret: $JWT_REFRESH_SECRET" >> ~/credentials.txt

# Create backend .env file
nano apps/api/.env
```

**Paste the following configuration (replace ALL placeholder values):**
```bash
# === ENVIRONMENT ===
NODE_ENV=production

# === SERVER ===
PORT=4000
HOST=localhost

# === DATABASE ===
# Replace YOUR_DB_PASSWORD with the password from ~/credentials.txt
DATABASE_URL="postgresql://memory_user:YOUR_DB_PASSWORD@localhost:5432/memory_connector?schema=public"

# === REDIS ===
# Replace YOUR_REDIS_PASSWORD with the password from ~/credentials.txt
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# === JWT AUTHENTICATION ===
# Replace with values from ~/credentials.txt
JWT_ACCESS_SECRET=YOUR_JWT_ACCESS_SECRET
JWT_REFRESH_SECRET=YOUR_JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# === OPENAI API ===
# Replace with your OpenAI API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE

# === CORS CONFIGURATION ===
# Replace yourdomain.com with your actual domain
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# === AI COST MANAGEMENT ===
# Daily budget in cents ($5.00 = 500 cents)
AI_DAILY_BUDGET_CENTS=500
AI_BUDGET_ALERT_THRESHOLD=0.9

# === EMAIL ALERTS (Optional - for budget notifications) ===
ADMIN_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# === ENRICHMENT WORKER ===
ENRICHMENT_WORKER_ENABLED=true
ENRICHMENT_POLL_INTERVAL_MS=5000

# === LOGGING ===
LOG_LEVEL=info
LOG_FORMAT=json

# === RATE LIMITING ===
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# === SECURITY ===
BCRYPT_ROUNDS=10
```

**Save and exit**: `Ctrl+X`, `Y`, `Enter`

**Verify configuration:**
```bash
# Check .env file exists and has correct permissions
ls -la apps/api/.env
# Expected: -rw-r--r-- 1 deploy deploy

# Verify DATABASE_URL format (should not show actual password in logs)
grep "DATABASE_URL" apps/api/.env | sed 's/:[^@]*@/:****@/'
# Expected: DATABASE_URL="postgresql://memory_user:****@localhost:5432/memory_connector?schema=public"
```

#### 4.5 Build Backend Application

```bash
# Navigate to backend
cd /var/www/memory-connector/apps/api

# Generate Prisma client
pnpm db:generate

# Build TypeScript application
pnpm build

# Verify build output
ls -la dist/
# Expected: dist/main.js and other compiled files

# Check build was successful
file dist/main.js
# Expected: dist/main.js: Node.js script text executable
```

#### 4.6 Run Database Migrations

```bash
# From apps/api directory
cd /var/www/memory-connector/apps/api

# Run Prisma migrations (use deploy for production, not dev)
pnpm prisma migrate deploy

# Expected output:
# - Applying migrations...
# - Migration applied successfully
# Note: migrate deploy is used in production (doesn't create shadow database)

# Verify migrations
pnpm prisma migrate status
# Expected: Database schema is up to date!

# Optional: Seed database with test user
pnpm db:seed
# Creates user: test@example.com with password: password123
```

#### 4.7 Configure PM2 Process Manager

```bash
# Create PM2 ecosystem file
cd /var/www/memory-connector
nano ecosystem.config.js
```

**Paste the following PM2 configuration:**
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
      env_file: '/var/www/memory-connector/apps/api/.env',
      error_file: '/var/log/memory-connector/api-error.log',
      out_file: '/var/log/memory-connector/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
```

**Save and exit**: `Ctrl+X`, `Y`, `Enter`

**Create log directory and start application:**
```bash
# Create log directory
sudo mkdir -p /var/log/memory-connector
sudo chown deploy:deploy /var/log/memory-connector

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Configure PM2 to start on system boot
pm2 startup systemd -u deploy --hp /home/deploy
# Copy and run the command it outputs (starting with 'sudo env PATH=...')

# Verify application is running
pm2 status
# Expected: memory-connector-api status should be 'online'

# View application logs
pm2 logs memory-connector-api --lines 50
# Expected: Should show NestJS startup logs

# Test API health endpoint
curl http://localhost:4000/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

### Step 5: Deploy Frontend Application

#### 5.1 Configure Frontend Environment

```bash
# Navigate to frontend directory
cd /var/www/memory-connector/apps/web

# Create production environment file
nano .env.production
```

**Paste the following (replace yourdomain.com with your actual domain):**
```bash
# API URL - This tells frontend where to send API requests
VITE_API_URL=https://yourdomain.com/api
```

**Save and exit**: `Ctrl+X`, `Y`, `Enter`

#### 5.2 Build Frontend Application

```bash
# Build production-optimized frontend
pnpm build

# Expected: Build completes successfully
# Build output is in: apps/web/dist/

# Verify build output
ls -la dist/
# Expected: index.html, assets/, and other static files

# Check total size
du -sh dist/
# Expected: ~2-5 MB

# Verify index.html exists
cat dist/index.html | head -n 10
# Expected: HTML content with Vite build
```

---

### Step 6: Configure Nginx Web Server

#### 6.1 Create Nginx Site Configuration

```bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/memory-connector
```

**Paste the following Nginx configuration (replace yourdomain.com):**
```nginx
# Upstream backend API server
upstream memory_connector_api {
    server localhost:4000 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate paths (will be configured by Certbot)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Frontend root directory
    root /var/www/memory-connector/apps/web/dist;
    index index.html;

    # Logging
    access_log /var/log/nginx/memory-connector-access.log;
    error_log /var/log/nginx/memory-connector-error.log warn;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss image/svg+xml;
    gzip_disable "msie6";

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Content Security Policy (adjust as needed)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://yourdomain.com; frame-ancestors 'none';" always;

    # API Proxy Configuration
    location /api/v1 {
        proxy_pass http://memory_connector_api/api/v1;
        proxy_http_version 1.1;

        # Proxy headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # Proxy timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # Cache bypass
        proxy_cache_bypass $http_upgrade;

        # CORS headers (handled by backend, but added here for OPTIONS)
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Idempotency-Key' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            return 204;
        }
    }

    # API Documentation (Swagger)
    location /api/v1/docs {
        proxy_pass http://memory_connector_api/api/v1/docs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend Static Files - Try files first, fallback to index.html for SPA routing
    location / {
        try_files $uri $uri/ /index.html;

        # Cache control for HTML
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        }

        # Cache control for static assets (JS, CSS, fonts, images)
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }

    # Health check endpoint (bypass for monitoring)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files (e.g., .git, .env)
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Deny access to sensitive files
    location ~* \.(env|sql|conf|ini|log|bak|old)$ {
        deny all;
    }

    # File upload size limit
    client_max_body_size 10M;

    # Request limits
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

**Save and exit**: `Ctrl+X`, `Y`, `Enter`

#### 6.2 Enable Site and Test Configuration

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/memory-connector /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
# Expected: nginx: configuration file /etc/nginx/nginx.conf test is successful

# If test fails, check error messages and fix configuration
# Common issues:
# - Syntax errors in nginx.conf
# - Missing semicolons
# - Incorrect file paths

# Reload Nginx to apply changes
sudo systemctl reload nginx

# Verify Nginx is running
sudo systemctl status nginx
# Expected: Active (running)
```

---

### Step 7: Setup SSL Certificate (Let's Encrypt)

#### 7.1 Verify DNS Configuration

**Before requesting SSL certificate, verify DNS is pointing to your VPS:**
```bash
# Check A record resolution
dig +short yourdomain.com
# Expected: YOUR_VPS_IP (e.g., 123.45.67.89)

dig +short www.yourdomain.com
# Expected: YOUR_VPS_IP (e.g., 123.45.67.89)

# If DNS not resolving correctly:
# 1. Check GoDaddy DNS management
# 2. Wait for DNS propagation (up to 24 hours)
# 3. Use https://dnschecker.org to verify global propagation
```

#### 7.2 Obtain SSL Certificate with Certbot

```bash
# Create directory for ACME challenges
sudo mkdir -p /var/www/certbot

# Run Certbot with Nginx plugin
# Replace yourdomain.com with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow interactive prompts:
# 1. Enter email address: your-email@example.com
# 2. Agree to Terms of Service: Y
# 3. Share email with EFF (optional): Y or N
# 4. Certbot will automatically:
#    - Verify domain ownership via HTTP challenge
#    - Issue SSL certificate
#    - Update Nginx configuration
#    - Reload Nginx

# Expected output:
# Successfully received certificate.
# Certificate is saved at: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# Key is saved at: /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### 7.3 Verify SSL Certificate

```bash
# Check certificate details
sudo certbot certificates
# Expected: Shows certificate info, expiry date (90 days from now)

# Test HTTPS access
curl -I https://yourdomain.com
# Expected: HTTP/2 200 OK

# Test SSL Labs rating (from browser)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
# Expected: A or A+ rating
```

#### 7.4 Configure Automatic Certificate Renewal

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run
# Expected: Congratulations, all simulated renewals succeeded

# Verify certbot timer is enabled (auto-renewal)
sudo systemctl status certbot.timer
# Expected: Active (running)

# Optional: Add cron job as backup
sudo crontab -e
# Add this line:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"

# Save and exit
```

---

### Step 8: Configure Firewall (UFW)

```bash
# Install UFW if not already installed
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (CRITICAL - Do this first to avoid locking yourself out!)
sudo ufw allow 22/tcp comment 'SSH'
# Or if you changed SSH port to 2222:
# sudo ufw allow 2222/tcp comment 'SSH'

# Allow HTTP (for Let's Encrypt challenges)
sudo ufw allow 80/tcp comment 'HTTP'

# Allow HTTPS
sudo ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
sudo ufw enable
# Confirm: y

# Verify firewall status
sudo ufw status verbose
# Expected output:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere

# Verify you can still SSH
# Open new terminal window and test: ssh deploy@YOUR_VPS_IP
```

---

### Step 9: Setup Monitoring and Logging

#### 9.1 Configure PM2 Log Rotation

```bash
# Install PM2 log rotation module
pm2 install pm2-logrotate

# Configure log rotation settings
pm2 set pm2-logrotate:max_size 10M        # Rotate when log reaches 10MB
pm2 set pm2-logrotate:retain 7            # Keep 7 rotated logs
pm2 set pm2-logrotate:compress true       # Compress rotated logs
pm2 set pm2-logrotate:workerInterval 30   # Check every 30 seconds

# Verify configuration
pm2 conf pm2-logrotate
```

#### 9.2 Setup System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# View system resources
htop
# Press F10 to exit

# Monitor PM2 processes
pm2 monit
# Press Ctrl+C to exit
```

#### 9.3 Create Health Check Script

```bash
# Create monitoring script
nano ~/health-check.sh
```

**Paste the following:**
```bash
#!/bin/bash

echo "=== Memory Connector Health Check ==="
echo "Date: $(date)"
echo ""

# Check PM2 process
echo "--- PM2 Status ---"
pm2 status memory-connector-api | grep -E "name|status|cpu|memory"
echo ""

# Check API health
echo "--- API Health ---"
curl -s http://localhost:4000/api/v1/health || echo "API health check failed"
echo ""

# Check PostgreSQL
echo "--- PostgreSQL Status ---"
sudo systemctl is-active postgresql || echo "PostgreSQL is not running"
echo ""

# Check Redis
echo "--- Redis Status ---"
sudo systemctl is-active redis-server || echo "Redis is not running"
echo ""

# Check Nginx
echo "--- Nginx Status ---"
sudo systemctl is-active nginx || echo "Nginx is not running"
echo ""

# Check disk space
echo "--- Disk Usage ---"
df -h / | grep -v Filesystem
echo ""

# Check memory
echo "--- Memory Usage ---"
free -h | grep -E "Mem|Swap"
echo ""

echo "=== Health Check Complete ==="
```

**Make executable and test:**
```bash
chmod +x ~/health-check.sh
~/health-check.sh
```

---

### Step 10: Create Database Backup System

#### 10.1 Create Backup Script

```bash
# Create backup directory
mkdir -p /home/deploy/backups

# Create backup script
nano /home/deploy/backup-db.sh
```

**Paste the following:**
```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="memory_connector"
DB_USER="memory_user"
RETENTION_DAYS=7

# Get database password from .env file
DB_PASSWORD=$(grep "DATABASE_URL" /var/www/memory-connector/apps/api/.env | cut -d':' -f3 | cut -d'@' -f1)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
echo "Starting database backup: $DATE"
PGPASSWORD="$DB_PASSWORD" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Verify backup was created
if [ -f "$BACKUP_DIR/db_$DATE.sql.gz" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1)
    echo "Backup created successfully: db_$DATE.sql.gz ($BACKUP_SIZE)"
else
    echo "ERROR: Backup failed"
    exit 1
fi

# Remove backups older than retention period
echo "Cleaning up old backups (keeping last $RETENTION_DAYS days)"
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo "Current backups:"
ls -lh $BACKUP_DIR/db_*.sql.gz 2>/dev/null || echo "No backups found"

echo "Backup complete: $(date)"
```

**Make executable:**
```bash
chmod +x /home/deploy/backup-db.sh

# Test backup
/home/deploy/backup-db.sh

# Verify backup file exists
ls -lh /home/deploy/backups/
```

#### 10.2 Schedule Automated Backups

```bash
# Edit crontab
crontab -e

# Add backup job (runs daily at 2 AM)
0 2 * * * /home/deploy/backup-db.sh >> /home/deploy/backup.log 2>&1

# Add health check job (runs every 6 hours)
0 */6 * * * /home/deploy/health-check.sh >> /home/deploy/health.log 2>&1

# Save and exit
```

---

### Step 11: Final Testing and Verification

#### 11.1 Test Backend API

```bash
# Test health endpoint
curl http://localhost:4000/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}

# Test through Nginx (HTTPS)
curl https://yourdomain.com/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}

# Test API documentation
curl https://yourdomain.com/api/v1/docs
# Expected: HTML content (Swagger UI)
```

#### 11.2 Test Frontend

**From your browser:**
1. Visit: `https://yourdomain.com`
2. Expected: Memory Connector login page loads
3. Test login with seeded user:
   - Email: `test@example.com`
   - Password: `password123`
4. Expected: Successful login, redirects to capture page
5. Test creating a memory
6. Test search functionality

#### 11.3 Verify All Services

```bash
# Check all systemd services
sudo systemctl status nginx postgresql redis-server

# Check PM2 processes
pm2 status

# View application logs
pm2 logs memory-connector-api --lines 50

# View Nginx logs
sudo tail -n 50 /var/log/nginx/memory-connector-access.log
sudo tail -n 50 /var/log/nginx/memory-connector-error.log

# Check database connections
PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d memory_connector -c "SELECT count(*) FROM users;"
# Expected: Returns count of users

# Check Redis
redis-cli -a "$REDIS_PASSWORD" ping
# Expected: PONG
```

---

## 📊 Post-Deployment Checklist

Complete this checklist to ensure production readiness:

- [ ] **Infrastructure**
  - [ ] VPS accessible via SSH with key authentication
  - [ ] Non-root user created with sudo access
  - [ ] Root SSH login disabled
  - [ ] UFW firewall configured and enabled
  - [ ] DNS A records pointing to VPS IP

- [ ] **Services**
  - [ ] PostgreSQL 16 running with pgvector extension
  - [ ] Redis running with password authentication
  - [ ] Nginx running and serving HTTPS
  - [ ] PM2 managing backend process
  - [ ] All services configured to start on boot

- [ ] **Application**
  - [ ] Backend API responding to health checks
  - [ ] Frontend accessible at https://yourdomain.com
  - [ ] Database migrations completed
  - [ ] Environment variables configured correctly
  - [ ] CORS configured for production domain

- [ ] **Security**
  - [ ] SSL certificate installed (Let's Encrypt)
  - [ ] SSL auto-renewal configured
  - [ ] Security headers configured in Nginx
  - [ ] Database passwords are strong (20+ characters)
  - [ ] JWT secrets are random and secure
  - [ ] Redis password authentication enabled
  - [ ] Firewall allows only necessary ports (22, 80, 443)

- [ ] **Monitoring**
  - [ ] PM2 log rotation configured
  - [ ] Database backups scheduled (daily at 2 AM)
  - [ ] Health check script configured
  - [ ] Log files accessible and rotated

- [ ] **Testing**
  - [ ] Can login to application
  - [ ] Can create memories
  - [ ] Can search memories
  - [ ] API documentation accessible (/api/v1/docs)
  - [ ] SSL certificate shows A/A+ rating (SSL Labs)

---

## 🔄 Application Updates

### Update Process

```bash
# Connect to VPS
ssh deploy@YOUR_VPS_IP

# Navigate to application directory
cd /var/www/memory-connector

# Pull latest code (if using Git)
git pull origin main

# Install new dependencies
pnpm install

# Build backend
cd apps/api
pnpm build

# Run database migrations (if any) - use deploy for production
pnpm prisma migrate deploy

# Build frontend
cd ../web
pnpm build

# Restart backend
pm2 restart memory-connector-api

# Reload Nginx (if config changed)
sudo systemctl reload nginx

# Verify deployment
pm2 status
curl https://yourdomain.com/api/v1/health
```

---

## 🔧 Troubleshooting

### Backend Not Starting

**Check PM2 logs:**
```bash
pm2 logs memory-connector-api --lines 100
```

**Common issues:**
- Database connection failed → Check DATABASE_URL in .env
- Redis connection failed → Check REDIS_PASSWORD in .env
- Port 4000 in use → Check with `sudo netstat -tulpn | grep 4000`
- Missing dependencies → Run `pnpm install` in apps/api

**Test database connection:**
```bash
PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d memory_connector -c "SELECT 1;"
```

### Frontend Not Loading

**Check Nginx logs:**
```bash
sudo tail -f /var/log/nginx/memory-connector-error.log
```

**Common issues:**
- 502 Bad Gateway → Backend not running, check PM2
- 404 Not Found → Check frontend build exists in apps/web/dist
- CORS errors → Check CORS_ORIGIN in backend .env
- SSL errors → Check certificate with `sudo certbot certificates`

**Test Nginx configuration:**
```bash
sudo nginx -t
```

### Database Connection Issues

**Check PostgreSQL status:**
```bash
sudo systemctl status postgresql
```

**Check PostgreSQL logs:**
```bash
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

**Verify pgvector extension:**
```bash
sudo -u postgres psql -d memory_connector -c "\dx"
# Should show "vector" extension
```

**Test connection:**
```bash
PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d memory_connector
```

### Redis Connection Issues

**Check Redis status:**
```bash
sudo systemctl status redis-server
```

**Check Redis logs:**
```bash
sudo tail -f /var/log/redis/redis-server.log
```

**Test connection:**
```bash
redis-cli -a "$REDIS_PASSWORD" ping
# Expected: PONG
```

### SSL Certificate Issues

**Check certificate status:**
```bash
sudo certbot certificates
```

**Test renewal:**
```bash
sudo certbot renew --dry-run
```

**Force renewal (if needed):**
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### High Memory Usage

**Check memory:**
```bash
free -h
htop
```

**Reduce PM2 instances:**
```bash
# Edit ecosystem.config.js
nano ecosystem.config.js
# Change instances from 2 to 1

# Restart PM2
pm2 restart memory-connector-api
```

### Disk Space Issues

**Check disk usage:**
```bash
df -h
du -sh /var/www/memory-connector
du -sh /home/deploy/backups
```

**Clean up:**
```bash
# Remove old logs
sudo journalctl --vacuum-time=7d

# Remove old backups (older than 30 days)
find /home/deploy/backups -name "db_*.sql.gz" -mtime +30 -delete

# Clean npm cache
pnpm store prune
```

---

## 🚀 Quick Commands Reference

```bash
# === Service Management ===
# Check all services
pm2 status
sudo systemctl status nginx postgresql redis-server

# Restart services
pm2 restart memory-connector-api
sudo systemctl restart nginx
sudo systemctl restart postgresql
sudo systemctl restart redis-server

# === Logs ===
# Backend logs
pm2 logs memory-connector-api
pm2 logs memory-connector-api --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/memory-connector-access.log
sudo tail -f /var/log/nginx/memory-connector-error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log

# === Database ===
# Connect to database
PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d memory_connector

# Run migrations (production)
cd /var/www/memory-connector/apps/api && pnpm prisma migrate deploy

# Create backup
/home/deploy/backup-db.sh

# Restore backup
gunzip < /home/deploy/backups/db_YYYYMMDD_HHMMSS.sql.gz | \
  PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d memory_connector

# === Health Checks ===
# API health
curl http://localhost:4000/api/v1/health
curl https://yourdomain.com/api/v1/health

# Full health check
~/health-check.sh

# === Monitoring ===
# System resources
htop
pm2 monit

# Disk usage
df -h
du -sh /var/www/memory-connector

# Memory usage
free -h
```

---

## 💰 Production Cost Estimate

### GoDaddy VPS Pricing (2025)
- **VPS 4GB RAM** (Recommended): $50-60/month
- **VPS 8GB RAM** (Heavy usage): $80-100/month

### Additional Costs
- **Domain Registration**: $12-20/year
- **SSL Certificate**: FREE (Let's Encrypt)
- **VPS Backups**: Included
- **OpenAI API**: $5-50/month (usage-based)

**Total Monthly Cost**: $55-110/month

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks

**Daily (Automated):**
- Database backups (2 AM)
- Health checks (every 6 hours)

**Weekly:**
- Review application logs for errors
- Check disk space usage
- Verify backup integrity

**Monthly:**
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review security updates
- Test backup restoration process
- Review OpenAI API usage and costs

**Quarterly:**
- Review and update dependencies
- Security audit
- Performance optimization

---

## ✅ Deployment Complete

Your Memory Connector application is now running in production on GoDaddy VPS with:

- ✅ Full-stack deployment (frontend + backend + database)
- ✅ SSL/TLS encryption (HTTPS)
- ✅ Automated backups
- ✅ Process monitoring (PM2)
- ✅ Firewall protection
- ✅ Log rotation
- ✅ Health checks

**Access your application:**
- **Frontend**: https://yourdomain.com
- **API**: https://yourdomain.com/api/v1
- **API Docs**: https://yourdomain.com/api/v1/docs

**Support Resources:**
- Check logs first: `pm2 logs memory-connector-api`
- Run health check: `~/health-check.sh`
- Review troubleshooting section above
- Consult application documentation in `/CLAUDE.md`

---

**Last Updated**: December 31, 2025
**Guide Version**: 2.0 (Production)
