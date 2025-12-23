# Quick Phase 2 API Test
$baseUrl = "http://localhost:4000/api/v1"

Write-Host "`n=== PHASE 2 QUICK TEST ===" -ForegroundColor Cyan

# Test 1: Login
Write-Host "`n[1] Testing Login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"email":"test@example.com","password":"password123"}' `
        -ErrorAction Stop

    $token = $loginResponse.accessToken
    Write-Host "  ✓ Login successful" -ForegroundColor Green
    Write-Host "  User ID: $($loginResponse.user.id)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Create Memory
Write-Host "`n[2] Testing Memory Creation..." -ForegroundColor Yellow
try {
    $memoryResponse = Invoke-RestMethod -Uri "$baseUrl/memories" -Method POST `
        -Headers @{
            "Content-Type"="application/json"
            "Authorization"="Bearer $token"
        } `
        -Body '{"textContent":"Testing Phase 2 - All features working!","type":"note"}' `
        -ErrorAction Stop

    $memoryId = $memoryResponse.id
    Write-Host "  ✓ Memory created: $memoryId" -ForegroundColor Green
    Write-Host "  Content hash: $($memoryResponse.contentHash)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get Memories
Write-Host "`n[3] Testing Memory Retrieval..." -ForegroundColor Yellow
try {
    $memories = Invoke-RestMethod -Uri "$baseUrl/memories" -Method GET `
        -Headers @{"Authorization"="Bearer $token"} `
        -ErrorAction Stop

    Write-Host "  ✓ Retrieved $($memories.Count) memories" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Search
Write-Host "`n[4] Testing Search..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/search?q=testing" -Method GET `
        -Headers @{"Authorization"="Bearer $token"} `
        -ErrorAction Stop

    Write-Host "  ✓ Search found $($searchResponse.totalCount) results" -ForegroundColor Green
    Write-Host "  Method: $($searchResponse.method), Degraded: $($searchResponse.degraded)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Duplicate Detection
Write-Host "`n[5] Testing Duplicate Detection..." -ForegroundColor Yellow
try {
    $dupResponse = Invoke-RestMethod -Uri "$baseUrl/memories" -Method POST `
        -Headers @{
            "Content-Type"="application/json"
            "Authorization"="Bearer $token"
        } `
        -Body '{"textContent":"Testing Phase 2 - All features working!","type":"note"}' `
        -ErrorAction Stop

    Write-Host "  ✗ Should have detected duplicate" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "  ✓ Duplicate detected correctly" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== TESTS COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
