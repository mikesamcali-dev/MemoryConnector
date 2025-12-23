# Phase 2 Manual Testing Script
# Tests: Memory Creation, Duplicate Detection, Search, Tier Limits

param(
    [string]$BaseUrl = "http://localhost:4000/api/v1",
    [string]$TestEmail = "phase2test@example.com",
    [string]$TestPassword = "TestPassword123!"
)

$ErrorActionPreference = "Continue"
$TestResults = @()

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = ""
    )
    $status = if ($Passed) { "PASS" } else { "FAIL" }
    $color = if ($Passed) { "Green" } else { "Red" }

    Write-Host "[$status] " -ForegroundColor $color -NoNewline
    Write-Host $TestName -ForegroundColor White
    if ($Details) {
        Write-Host "      $Details" -ForegroundColor Gray
    }

    $script:TestResults += @{
        Name = $TestName
        Passed = $Passed
        Details = $Details
    }
}

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = "",
        [hashtable]$Headers = @{}
    )

    $uri = "$BaseUrl$Endpoint"
    $requestHeaders = @{
        "Content-Type" = "application/json"
    }

    if ($Token) {
        $requestHeaders["Authorization"] = "Bearer $Token"
    }

    foreach ($key in $Headers.Keys) {
        $requestHeaders[$key] = $Headers[$key]
    }

    try {
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $requestHeaders
        }

        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }

        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $null

        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
        } catch {}

        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $statusCode
            ErrorBody = $errorBody
        }
    }
}

# ============================================================================
# START TESTS
# ============================================================================

Write-Host "`n"
Write-Host "█████████████████████████████████████" -ForegroundColor Magenta
Write-Host "█  PHASE 2 TESTING - CORE FEATURES  █" -ForegroundColor Magenta
Write-Host "█████████████████████████████████████" -ForegroundColor Magenta
Write-Host ""
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Test User: $TestEmail" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# TEST 1: AUTHENTICATION
# ============================================================================

Write-TestHeader "TEST 1: Authentication & Setup"

# Cleanup - try to delete test user if exists
try {
    # We can't delete via API without admin privileges, so just try to login
    Write-Host "Checking if test user exists..." -ForegroundColor Gray
} catch {}

# Create test user
Write-Host "`nCreating test user..." -ForegroundColor Gray
$signupResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/signup" -Body @{
    email = $TestEmail
    password = $TestPassword
}

if ($signupResult.Success -or $signupResult.StatusCode -eq 409) {
    # Login
    Write-Host "Logging in..." -ForegroundColor Gray
    $loginResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/login" -Body @{
        email = $TestEmail
        password = $TestPassword
    }

    if ($loginResult.Success) {
        $authToken = $loginResult.Data.accessToken
        $userId = $loginResult.Data.user.id
        Write-TestResult "Authentication successful" $true "User ID: $userId"
    } else {
        Write-TestResult "Login failed" $false $loginResult.Error
        Write-Host "Cannot continue tests without authentication" -ForegroundColor Red
        exit 1
    }
} else {
    Write-TestResult "User creation failed" $false $signupResult.Error
    exit 1
}

# ============================================================================
# TEST 2: MEMORY CREATION
# ============================================================================

Write-TestHeader "TEST 2: Memory Creation"

$memory1 = Invoke-ApiRequest -Method POST -Endpoint "/memories" -Token $authToken -Body @{
    textContent = "[PHASE2-TEST] Machine learning algorithms for data analysis"
    type = "note"
}

if ($memory1.Success) {
    $memoryId = $memory1.Data.id
    Write-TestResult "Create first memory" $true "Memory ID: $memoryId"
    Write-Host "      Enrichment status: $($memory1.Data.enrichmentStatus)" -ForegroundColor Gray
} else {
    Write-TestResult "Create first memory" $false $memory1.Error
}

Start-Sleep -Seconds 1

$memory2 = Invoke-ApiRequest -Method POST -Endpoint "/memories" -Token $authToken -Body @{
    textContent = "[PHASE2-TEST] Deep learning frameworks like TensorFlow and PyTorch"
    type = "note"
}

if ($memory2.Success) {
    Write-TestResult "Create second memory" $true "Memory ID: $($memory2.Data.id)"
} else {
    Write-TestResult "Create second memory" $false $memory2.Error
}

Start-Sleep -Seconds 1

$memory3 = Invoke-ApiRequest -Method POST -Endpoint "/memories" -Token $authToken -Body @{
    textContent = "[PHASE2-TEST] Cooking recipes for Italian pasta dishes"
    type = "note"
}

if ($memory3.Success) {
    Write-TestResult "Create third memory" $true "Memory ID: $($memory3.Data.id)"
} else {
    Write-TestResult "Create third memory" $false $memory3.Error
}

# ============================================================================
# TEST 3: DUPLICATE DETECTION
# ============================================================================

Write-TestHeader "TEST 3: Duplicate Detection"

$duplicate = Invoke-ApiRequest -Method POST -Endpoint "/memories" -Token $authToken -Body @{
    textContent = "[PHASE2-TEST] Machine learning algorithms for data analysis"
    type = "note"
}

if ($duplicate.StatusCode -eq 409) {
    $passed = $duplicate.ErrorBody.error -eq "DUPLICATE_CONTENT"
    Write-TestResult "Detect duplicate content" $passed "Error: $($duplicate.ErrorBody.error)"
} else {
    Write-TestResult "Detect duplicate content" $false "Expected 409 Conflict, got $($duplicate.StatusCode)"
}

# Different content should work
$similar = Invoke-ApiRequest -Method POST -Endpoint "/memories" -Token $authToken -Body @{
    textContent = "[PHASE2-TEST] Machine learning algorithms for data analysis - DIFFERENT VERSION"
    type = "note"
}

if ($similar.Success) {
    Write-TestResult "Allow similar but different content" $true
} else {
    Write-TestResult "Allow similar but different content" $false $similar.Error
}

# ============================================================================
# TEST 4: IDEMPOTENCY
# ============================================================================

Write-TestHeader "TEST 4: Idempotency"

$idempotencyKey = "test-idempotency-" + (Get-Date).Ticks
$headers1 = @{ "Idempotency-Key" = $idempotencyKey }

$idem1 = Invoke-ApiRequest -Method POST -Endpoint "/memories" -Token $authToken `
    -Headers $headers1 `
    -Body @{
        textContent = "[PHASE2-TEST] Idempotency test message"
        type = "note"
    }

if ($idem1.Success) {
    $idemMemoryId = $idem1.Data.id
    Write-TestResult "First idempotent request" $true "Memory ID: $idemMemoryId"

    # Same request with same key
    Start-Sleep -Seconds 1

    $idem2 = Invoke-ApiRequest -Method POST -Endpoint "/memories" -Token $authToken `
        -Headers $headers1 `
        -Body @{
            textContent = "[PHASE2-TEST] Idempotency test message"
            type = "note"
        }

    if ($idem2.Success -and $idem2.Data.id -eq $idemMemoryId) {
        Write-TestResult "Idempotency replay (same ID)" $true "Replayed memory ID: $($idem2.Data.id)"
    } else {
        Write-TestResult "Idempotency replay (same ID)" $false "Expected same ID, got different"
    }
} else {
    Write-TestResult "First idempotent request" $false $idem1.Error
}

# ============================================================================
# TEST 5: MEMORY RETRIEVAL
# ============================================================================

Write-TestHeader "TEST 5: Memory Retrieval"

$allMemories = Invoke-ApiRequest -Method GET -Endpoint "/memories" -Token $authToken

if ($allMemories.Success) {
    $count = $allMemories.Data.Count
    Write-TestResult "Get all memories" $true "Found $count memories"
} else {
    Write-TestResult "Get all memories" $false $allMemories.Error
}

if ($memoryId) {
    $singleMemory = Invoke-ApiRequest -Method GET -Endpoint "/memories/$memoryId" -Token $authToken

    if ($singleMemory.Success) {
        $matches = $singleMemory.Data.id -eq $memoryId
        Write-TestResult "Get specific memory by ID" $matches
    } else {
        Write-TestResult "Get specific memory by ID" $false $singleMemory.Error
    }
}

# Test 404 for non-existent memory
$fakeId = "00000000-0000-0000-0000-000000000000"
$notFound = Invoke-ApiRequest -Method GET -Endpoint "/memories/$fakeId" -Token $authToken

if ($notFound.StatusCode -eq 404) {
    Write-TestResult "Return 404 for non-existent memory" $true
} else {
    Write-TestResult "Return 404 for non-existent memory" $false "Expected 404, got $($notFound.StatusCode)"
}

# ============================================================================
# TEST 6: SEARCH FUNCTIONALITY
# ============================================================================

Write-TestHeader "TEST 6: Search Functionality"

Write-Host "`nWaiting 2 seconds for text_search_vector to update..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# Search for machine learning
$search1 = Invoke-ApiRequest -Method GET -Endpoint "/search?q=machine+learning" -Token $authToken

if ($search1.Success) {
    $hasResults = $search1.Data.memories.Count -gt 0
    $method = $search1.Data.method
    $degraded = $search1.Data.degraded

    Write-TestResult "Search for 'machine learning'" $hasResults "Found $($search1.Data.totalCount) results"
    Write-Host "      Search method: $method (degraded: $degraded)" -ForegroundColor Gray

    if ($hasResults) {
        $relevantResult = $search1.Data.memories | Where-Object {
            $_.textContent -like "*machine learning*"
        }
        if ($relevantResult) {
            Write-Host "      ✓ Found relevant result" -ForegroundColor Green
        }
    }
} else {
    Write-TestResult "Search for 'machine learning'" $false $search1.Error
}

# Search for cooking
$search2 = Invoke-ApiRequest -Method GET -Endpoint "/search?q=cooking+recipes" -Token $authToken

if ($search2.Success) {
    $hasResults = $search2.Data.memories.Count -gt 0
    Write-TestResult "Search for 'cooking recipes'" $hasResults "Found $($search2.Data.totalCount) results"
    Write-Host "      Search method: $($search2.Data.method) (degraded: $($search2.Data.degraded))" -ForegroundColor Gray
} else {
    Write-TestResult "Search for 'cooking recipes'" $false $search2.Error
}

# Empty search
$search3 = Invoke-ApiRequest -Method GET -Endpoint "/search?q=" -Token $authToken

if ($search3.Success) {
    $isEmpty = $search3.Data.memories.Count -eq 0
    Write-TestResult "Empty search query" $isEmpty "Returned $($search3.Data.memories.Count) results"
} else {
    Write-TestResult "Empty search query" $false $search3.Error
}

# No results search
$search4 = Invoke-ApiRequest -Method GET -Endpoint "/search?q=nonexistentkeywordxyz123" -Token $authToken

if ($search4.Success) {
    $noResults = $search4.Data.totalCount -eq 0
    Write-TestResult "Search with no results" $noResults
} else {
    Write-TestResult "Search with no results" $false $search4.Error
}

# ============================================================================
# TEST 7: USAGE LIMITS
# ============================================================================

Write-TestHeader "TEST 7: Usage Limits"

$usage = Invoke-ApiRequest -Method GET -Endpoint "/usage" -Token $authToken

if ($usage.Success) {
    Write-TestResult "Get usage statistics" $true
    Write-Host "      Memories created today: $($usage.Data.usage.memoriesCreated)" -ForegroundColor Gray
    Write-Host "      Daily limit: $($usage.Data.limits.memoriesPerDay)" -ForegroundColor Gray
    Write-Host "      Tier: $($usage.Data.tier)" -ForegroundColor Gray
} else {
    Write-TestResult "Get usage statistics" $false $usage.Error
}

# ============================================================================
# TEST 8: DATABASE VERIFICATION
# ============================================================================

Write-TestHeader "TEST 8: Database Verification (SQL)"

Write-Host "`nConnect to PostgreSQL to verify:" -ForegroundColor Yellow
Write-Host "docker exec -it postgres-memory-connector psql -U postgres -d memory_connector" -ForegroundColor White
Write-Host ""
Write-Host "Run these SQL commands:" -ForegroundColor Yellow
Write-Host "# Check embeddings" -ForegroundColor Gray
Write-Host "SELECT COUNT(*) FROM embeddings WHERE user_id = '$userId'::uuid;" -ForegroundColor White
Write-Host ""
Write-Host "# Check text_search_vector" -ForegroundColor Gray
Write-Host "SELECT id, text_content, text_search_vector IS NOT NULL as has_tsvector FROM memories WHERE user_id = '$userId'::uuid LIMIT 5;" -ForegroundColor White
Write-Host ""
Write-Host "# Test full-text search function" -ForegroundColor Gray
Write-Host "SELECT * FROM search_memories_keyword('$userId'::uuid, 'machine & learning');" -ForegroundColor White
Write-Host ""

# ============================================================================
# TEST SUMMARY
# ============================================================================

Write-Host "`n"
Write-Host "================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $TestResults.Count
$passedTests = ($TestResults | Where-Object { $_.Passed }).Count
$failedTests = $totalTests - $passedTests
$passRate = [math]::Round(($passedTests / $totalTests) * 100, 1)

Write-Host "Total Tests:  $totalTests" -ForegroundColor White
Write-Host "Passed:       " -NoNewline
Write-Host $passedTests -ForegroundColor Green
Write-Host "Failed:       " -NoNewline
Write-Host $failedTests -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "Pass Rate:    $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })
Write-Host ""

if ($failedTests -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $TestResults | Where-Object { -not $_.Passed } | ForEach-Object {
        Write-Host "  ✗ $($_.Name)" -ForegroundColor Red
        if ($_.Details) {
            Write-Host "    $($_.Details)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# NEXT STEPS
# ============================================================================

Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Run E2E test suite:" -ForegroundColor White
Write-Host "   cd apps\api" -ForegroundColor Gray
Write-Host "   pnpm test:e2e phase2" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check embeddings generation:" -ForegroundColor White
Write-Host "   - Set OPENAI_API_KEY in .env" -ForegroundColor Gray
Write-Host "   - Wait 30 seconds after creating memories" -ForegroundColor Gray
Write-Host "   - Check embeddings table in database" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test semantic search:" -ForegroundColor White
Write-Host "   - Requires OpenAI API key configured" -ForegroundColor Gray
Write-Host "   - Should return degraded=false when working" -ForegroundColor Gray
Write-Host ""
Write-Host "Phase 2 Core Features Testing Complete!" -ForegroundColor Green
Write-Host ""
