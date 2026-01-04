# Memory Connector Production Deployment Script
# This script deploys the latest changes to the GoDaddy VPS

$VPS_HOST = "160.153.184.11"
$VPS_USER = "memconnadmin"
$APP_DIR = "/var/www/memory-connector"

Write-Host "=== Memory Connector Deployment ===" -ForegroundColor Cyan
Write-Host "Target: $VPS_USER@$VPS_HOST" -ForegroundColor Yellow
Write-Host ""

# Step 1: Pull latest code
Write-Host "[1/7] Pulling latest code from GitHub..." -ForegroundColor Green
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && git pull origin main"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pulling code. Exiting." -ForegroundColor Red
    exit 1
}

# Step 2: Install dependencies
Write-Host "[2/7] Installing dependencies..." -ForegroundColor Green
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && pnpm install"

# Step 3: Build backend
Write-Host "[3/7] Building backend..." -ForegroundColor Green
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR/apps/api && pnpm build"

# Step 4: Run database migrations
Write-Host "[4/7] Running database migrations..." -ForegroundColor Green
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR/apps/api && pnpm prisma migrate deploy"

# Step 5: Build frontend
Write-Host "[5/7] Building frontend..." -ForegroundColor Green
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR/apps/web && pnpm build"

# Step 6: Restart backend with PM2
Write-Host "[6/7] Restarting backend with PM2..." -ForegroundColor Green
ssh $VPS_USER@$VPS_HOST "pm2 restart memory-connector-api"

# Step 7: Reload Nginx
Write-Host "[7/7] Reloading Nginx..." -ForegroundColor Green
ssh $VPS_USER@$VPS_HOST "sudo systemctl reload nginx"

# Verify deployment
Write-Host ""
Write-Host "=== Verifying Deployment ===" -ForegroundColor Cyan

Write-Host "Checking PM2 status..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_HOST "pm2 status"

Write-Host ""
Write-Host "Testing API health..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_HOST "curl -s https://memoryconnector.com/api/v1/health"

Write-Host ""
Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "Frontend: https://memoryconnector.com" -ForegroundColor Cyan
Write-Host "API: https://memoryconnector.com/api/v1" -ForegroundColor Cyan
Write-Host "API Docs: https://memoryconnector.com/api/v1/docs" -ForegroundColor Cyan
