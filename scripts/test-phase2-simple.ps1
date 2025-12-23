# Phase 2 Simple Testing Script
param(
    [string]$BaseUrl = "http://localhost:4000/api/v1"
)

Write-Host "`n===== PHASE 2 TESTING =====" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Gray

# Test 1: Login
Write-Host "[1/8] Testing Authentication..." -ForegroundColor Yellow
try {
    $login = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"email":"test@example.com","password":"password123"}' `
        -ErrorAction Stop

    $token = $login.accessToken
    Write-Host "  ✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Create Memory
Write-Host "`n[2/8] Testing Memory Creation..." -ForegroundColor Yellow
try {
    $memory = Invoke-RestMethod -Uri "$BaseUrl/memories" -Method POST `
        -Headers @{
            "Content-Type"="application/json"
            "Authorization"="Bearer $token"
        } `
        -Body '{"textContent":"[TEST] Machine learning and AI research","type":"note"}' `
        -ErrorAction Stop

    $memoryId = $memory.id
    Write-Host "  ✓ Memory created: $memoryId" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
}

# Test 3: Duplicate Detection
Write-Host "`n[3/8] Testing Duplicate Detection..." -ForegroundColor Yellow
try {
    $dup = Invoke-RestMethod -Uri "$BaseUrl/memories" -Method POST `
        -Headers @{
            "Content-Type"="application/json"
            "Authorization"="Bearer $token"
        } `
        -Body '{"textContent":"[TEST] Machine learning and AI research","type":"note"}' `
        -ErrorAction Stop

    Write-Host "  ✗ Should have detected duplicate" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "  ✓ Duplicate detected correctly" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 4: Get Memories
Write-Host "`n[4/8] Testing Memory Retrieval..." -ForegroundColor Yellow
try {
    $memories = Invoke-RestMethod -Uri "$BaseUrl/memories" -Method GET `
        -Headers @{"Authorization"="Bearer $token"} `
        -ErrorAction Stop

    Write-Host "  ✓ Retrieved $($memories.Count) memories" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
}

# Test 5: Search - Keyword
Write-Host "`n[5/8] Testing Search (Keyword)..." -ForegroundColor Yellow
try {
    $search = Invoke-RestMethod -Uri "$BaseUrl/search?q=machine+learning" -Method GET `
        -Headers @{"Authorization"="Bearer $token"} `
        -ErrorAction Stop

    Write-Host "  ✓ Search found $($search.totalCount) results" -ForegroundColor Green
    Write-Host "  Method: $($search.method), Degraded: $($search.degraded)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
}

# Test 6: Usage Stats
Write-Host "`n[6/8] Testing Usage Tracking..." -ForegroundColor Yellow
try {
    $usage = Invoke-RestMethod -Uri "$BaseUrl/usage" -Method GET `
        -Headers @{"Authorization"="Bearer $token"} `
        -ErrorAction Stop

    Write-Host "  ✓ Memories created today: $($usage.usage.memoriesCreated)" -ForegroundColor Green
    Write-Host "  Daily limit: $($usage.limits.memoriesPerDay), Tier: $($usage.tier)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
}

# Test 7: Health Check
Write-Host "`n[7/8] Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/../health" -Method GET -ErrorAction Stop
    Write-Host "  ✓ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
}

# Test 8: Idempotency
Write-Host "`n[8/8] Testing Idempotency..." -ForegroundColor Yellow
$idemKey = "test-idem-$(Get-Date -Format 'yyyyMMddHHmmss')"

try {
    $req1 = Invoke-RestMethod -Uri "$BaseUrl/memories" -Method POST `
        -Headers @{
            "Content-Type"="application/json"
            "Authorization"="Bearer $token"
            "Idempotency-Key"=$idemKey
        } `
        -Body '{"textContent":"[TEST] Idempotency test","type":"note"}' `
        -ErrorAction Stop

    Write-Host "  ✓ First request successful" -ForegroundColor Green

    Start-Sleep -Seconds 1

    $req2 = Invoke-WebRequest -Uri "$BaseUrl/memories" -Method POST `
        -Headers @{
            "Content-Type"="application/json"
            "Authorization"="Bearer $token"
            "Idempotency-Key"=$idemKey
        } `
        -Body '{"textContent":"[TEST] Idempotency test","type":"note"}' `
        -ErrorAction Stop

    $replayed = $req2.Headers['X-Idempotency-Replayed']
    if ($replayed) {
        Write-Host "  ✓ Idempotency working (replayed=$replayed)" -ForegroundColor Green
    } else {
        Write-Host "  ? Second request succeeded but no replay header" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
}

Write-Host "`n===== PHASE 2 TESTS COMPLETE =====" -ForegroundColor Cyan
Write-Host "`nNOTE: For full semantic search testing, configure OPENAI_API_KEY in .env file" -ForegroundColor Yellow
Write-Host ""
