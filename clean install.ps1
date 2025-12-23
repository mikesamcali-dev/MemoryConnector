# ============================================================================
# Memory Connector - Complete Clean Install Script for Windows
# ============================================================================
# This script will:
# 1. Stop all running services
# 2. Clean all data (Docker volumes, node_modules, build artifacts)
# 3. Reinstall dependencies
# 4. Setup database
# 5. Start services
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Memory Connector - Clean Install Script" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
$ProjectRoot = "C:\Visual Studio\Memory Connector"
if (-not (Test-Path $ProjectRoot)) {
    Write-Host "ERROR: Project directory not found at $ProjectRoot" -ForegroundColor Red
    Write-Host "Please update the `$ProjectRoot variable in this script." -ForegroundColor Yellow
    exit 1
}

Set-Location $ProjectRoot
Write-Host "Working directory: $ProjectRoot" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 1: Stop All Services
# ============================================================================
Write-Host "STEP 1: Stopping all services..." -ForegroundColor Cyan

# Stop Docker containers
Write-Host "  - Stopping Docker containers..." -ForegroundColor Gray
docker compose -f infra/compose/docker-compose.yml down 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Docker containers stopped" -ForegroundColor Green
} else {
    Write-Host "    No Docker containers running (this is OK)" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================================
# STEP 2: Clean Everything
# ============================================================================
Write-Host "STEP 2: Cleaning all data..." -ForegroundColor Cyan

# Remove Docker volumes
Write-Host "  - Removing Docker volumes..." -ForegroundColor Gray
docker volume rm memory-connector_postgres_data memory-connector_redis_data 2>$null
docker volume prune -f 2>$null
Write-Host "    Docker volumes cleaned" -ForegroundColor Green

# Remove node_modules (root and all apps)
Write-Host "  - Removing node_modules..." -ForegroundColor Gray
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "apps\api\node_modules") {
    Remove-Item -Recurse -Force "apps\api\node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "apps\web\node_modules") {
    Remove-Item -Recurse -Force "apps\web\node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "apps\worker\node_modules") {
    Remove-Item -Recurse -Force "apps\worker\node_modules" -ErrorAction SilentlyContinue
}
Write-Host "    node_modules cleaned" -ForegroundColor Green

# Remove build artifacts
Write-Host "  - Removing build artifacts..." -ForegroundColor Gray
if (Test-Path "apps\api\dist") {
    Remove-Item -Recurse -Force "apps\api\dist" -ErrorAction SilentlyContinue
}
if (Test-Path "apps\web\dist") {
    Remove-Item -Recurse -Force "apps\web\dist" -ErrorAction SilentlyContinue
}
if (Test-Path "apps\worker\dist") {
    Remove-Item -Recurse -Force "apps\worker\dist" -ErrorAction SilentlyContinue
}
Write-Host "    Build artifacts cleaned" -ForegroundColor Green

# Clean pnpm store (optional - saves disk space)
Write-Host "  - Pruning pnpm store..." -ForegroundColor Gray
pnpm store prune 2>$null
Write-Host "    pnpm store pruned" -ForegroundColor Green

Write-Host ""

# ============================================================================
# STEP 3: Install Dependencies
# ============================================================================
Write-Host "STEP 3: Installing dependencies..." -ForegroundColor Cyan
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 4: Start Database Services
# ============================================================================
Write-Host "STEP 4: Starting database services..." -ForegroundColor Cyan
pnpm db:up
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start database services" -ForegroundColor Red
    exit 1
}

# Wait for PostgreSQL to be ready
Write-Host "  - Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 5

$retries = 0
$maxRetries = 30
$ready = $false

while ($retries -lt $maxRetries -and -not $ready) {
    $result = docker exec memory-connector-postgres pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
    } else {
        $retries++
        Write-Host "    Waiting... ($retries/$maxRetries)" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

if ($ready) {
    Write-Host "  PostgreSQL is ready" -ForegroundColor Green
} else {
    Write-Host "ERROR: PostgreSQL failed to start" -ForegroundColor Red
    Write-Host "Run: docker logs memory-connector-postgres" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# ============================================================================
# STEP 5: Setup Database
# ============================================================================
Write-Host "STEP 5: Setting up database..." -ForegroundColor Cyan

Set-Location "apps\api"

# Generate Prisma Client
Write-Host "  - Generating Prisma Client..." -ForegroundColor Gray
pnpm db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to generate Prisma Client" -ForegroundColor Red
    Set-Location $ProjectRoot
    exit 1
}
Write-Host "    Prisma Client generated" -ForegroundColor Green

# Run migrations
Write-Host "  - Running database migrations..." -ForegroundColor Gray
pnpm db:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to run migrations" -ForegroundColor Red
    Set-Location $ProjectRoot
    exit 1
}
Write-Host "    Migrations completed" -ForegroundColor Green

# Seed database
Write-Host "  - Seeding database..." -ForegroundColor Gray
pnpm db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to seed database" -ForegroundColor Red
    Write-Host "This might be due to argon2 issues. See troubleshooting below." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    exit 1
}
Write-Host "    Database seeded" -ForegroundColor Green

Set-Location $ProjectRoot
Write-Host ""

# ============================================================================
# SUCCESS!
# ============================================================================
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "SUCCESS! Clean install completed!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Backend (Terminal 1):" -ForegroundColor White
Write-Host "   cd apps\api" -ForegroundColor Gray
Write-Host "   pnpm dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Frontend (Terminal 2):" -ForegroundColor White
Write-Host "   cd apps\web" -ForegroundColor Gray
Write-Host "   pnpm dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  - Frontend:    http://localhost:5173" -ForegroundColor Gray
Write-Host "  - Backend API: http://localhost:4000" -ForegroundColor Gray
Write-Host "  - API Docs:    http://localhost:4000/api/v1/docs" -ForegroundColor Gray
Write-Host "  - Prisma:      cd apps\api && pnpm db:studio" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green