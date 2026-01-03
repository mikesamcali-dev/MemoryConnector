# Admin App Deployment Script for Memory Connector
# This script builds and deploys the admin app to production

param(
    [string]$ServerUser = "memconnadmin",
    [string]$ServerIP = "160.153.184.11",
    [switch]$BuildOnly,
    [switch]$DeployOnly,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
Admin App Deployment Script
============================

Builds and deploys the admin application to production server.

USAGE:
    .\scripts\deploy-admin.ps1 [options]

OPTIONS:
    -BuildOnly       Only build the admin app locally (don't deploy)
    -DeployOnly      Only deploy (skip build - use existing dist)
    -ServerUser      SSH username (default: memconnadmin)
    -ServerIP        Server IP address (default: 160.153.184.11)
    -Help            Show this help message

EXAMPLES:
    # Full deployment (build + deploy)
    .\scripts\deploy-admin.ps1

    # Build only (for testing)
    .\scripts\deploy-admin.ps1 -BuildOnly

    # Deploy only (using existing build)
    .\scripts\deploy-admin.ps1 -DeployOnly

    # Custom server
    .\scripts\deploy-admin.ps1 -ServerUser myuser -ServerIP 192.168.1.100

REQUIREMENTS:
    - pnpm installed
    - SSH access to production server
    - Admin app source code in apps/admin/

"@
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Step "Checking Prerequisites"

    # Check if we're in the right directory
    if (-not (Test-Path "apps\admin\package.json")) {
        Write-Error "Not in Memory Connector root directory"
        Write-Host "Please run from: C:\Visual Studio\Memory Connector"
        exit 1
    }
    Write-Success "Working directory confirmed"

    # Check pnpm
    try {
        $null = pnpm --version
        Write-Success "pnpm is installed"
    }
    catch {
        Write-Error "pnpm not found. Please install pnpm first."
        exit 1
    }

    # Check SSH (for deploy)
    if (-not $BuildOnly) {
        try {
            $null = ssh -V 2>&1
            Write-Success "SSH client available"
        }
        catch {
            Write-Error "SSH client not found"
            exit 1
        }
    }
}

function Build-AdminApp {
    Write-Step "Building Admin Application"

    try {
        # Clean previous build
        if (Test-Path "apps\admin\dist") {
            Write-Host "Cleaning previous build..."
            Remove-Item -Path "apps\admin\dist" -Recurse -Force
        }

        # Build
        Write-Host "Running build command..."
        pnpm build:admin

        # Verify build
        if (-not (Test-Path "apps\admin\dist\index.html")) {
            Write-Error "Build failed - index.html not found"
            exit 1
        }

        $files = Get-ChildItem "apps\admin\dist" -Recurse | Measure-Object
        Write-Success "Build completed ($($files.Count) files)"

        # Show build contents
        Write-Host "`nBuild contents:"
        Get-ChildItem "apps\admin\dist" | Format-Table Name, Length -AutoSize
    }
    catch {
        Write-Error "Build failed: $_"
        exit 1
    }
}

function Deploy-AdminApp {
    Write-Step "Deploying Admin Application"

    $remotePath = "/var/www/memory-connector/apps/admin/dist"
    $server = "${ServerUser}@${ServerIP}"

    # Verify build exists
    if (-not (Test-Path "apps\admin\dist\index.html")) {
        Write-Error "No build found. Run with -BuildOnly first or without -DeployOnly"
        exit 1
    }

    try {
        # Create remote directory if needed
        Write-Host "Ensuring remote directory exists..."
        ssh $server "mkdir -p $remotePath"
        Write-Success "Remote directory ready"

        # Upload files
        Write-Host "Uploading files to $server..."
        Write-Host "Source: apps\admin\dist\*"
        Write-Host "Target: ${remotePath}/"

        # Use scp to upload
        scp -r "apps\admin\dist\*" "${server}:${remotePath}/"

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Upload failed"
            exit 1
        }

        Write-Success "Files uploaded successfully"

        # Verify deployment
        Write-Host "`nVerifying deployment..."
        $result = ssh $server "ls -la $remotePath"
        Write-Host $result

        Write-Success "Admin app deployed to $server"

        # Show next steps
        Write-Host "`n" -NoNewline
        Write-Host "NEXT STEPS:" -ForegroundColor Yellow
        Write-Host "1. If this is the first deployment, configure Nginx (see Docs\ADMIN_APP_DEPLOYMENT.md)"
        Write-Host "2. Visit https://admin.memoryconnector.com to test"
        Write-Host "3. Clear browser cache if page doesn't update"
        Write-Host "`nLogs: sudo tail -f /var/log/nginx/admin-memoryconnector-error.log"
    }
    catch {
        Write-Error "Deployment failed: $_"
        exit 1
    }
}

function Main {
    if ($Help) {
        Show-Help
        exit 0
    }

    Write-Host @"
============================================
   Memory Connector Admin Deployment
============================================
"@ -ForegroundColor Cyan

    Test-Prerequisites

    if (-not $DeployOnly) {
        Build-AdminApp
    }

    if (-not $BuildOnly) {
        Deploy-AdminApp
    }

    Write-Host "`n" -NoNewline
    Write-Host "[SUCCESS] Deployment Complete!" -ForegroundColor Green
}

# Run main function
Main
