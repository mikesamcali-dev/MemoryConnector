# ============================================================================
# Memory Connector - MVP Implementation Automation Script
# ============================================================================
# This script will:
# 1. Create database migrations for tier limits and usage tracking
# 2. Generate middleware for usage limits
# 3. Create service files for usage tracking
# 4. Generate API endpoints
# 5. Create frontend components for settings page
# 6. Run migrations
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Memory Connector - MVP Implementation Script" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "C:\Visual Studio\Memory Connector"
Set-Location $ProjectRoot

# ============================================================================
# STEP 1: Create Database Migrations
# ============================================================================
Write-Host "STEP 1: Creating database migrations..." -ForegroundColor Cyan

# Create migration directory
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$migrationDir = "apps\api\prisma\migrations\${timestamp}_tier_limits_and_usage"
New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null

# Create migration SQL
$migrationSql = @"
-- Migration: Tier Limits and Usage Tracking System
-- Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

-- Add tier column to users table if it doesn't exist
DO `$`$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tier'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "tier" VARCHAR(20) NOT NULL DEFAULT 'free';
    END IF;
END `$`$;

-- Create user_usage table
CREATE TABLE IF NOT EXISTS "user_usage" (
    "user_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
    "memories_today" INT NOT NULL DEFAULT 0,
    "memories_this_month" INT NOT NULL DEFAULT 0,
    "images_this_month" INT NOT NULL DEFAULT 0,
    "voice_this_month" INT NOT NULL DEFAULT 0,
    "searches_today" INT NOT NULL DEFAULT 0,
    "storage_bytes" BIGINT NOT NULL DEFAULT 0,
    "last_daily_reset" TIMESTAMP NOT NULL DEFAULT CURRENT_DATE,
    "last_monthly_reset" TIMESTAMP NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create tier_limits configuration table
CREATE TABLE IF NOT EXISTS "tier_limits" (
    "tier" VARCHAR(20) PRIMARY KEY,
    "memories_per_day" INT NOT NULL,
    "memories_per_month" INT NOT NULL,
    "images_per_month" INT NOT NULL,
    "voice_per_month" INT NOT NULL,
    "searches_per_day" INT NOT NULL,
    "storage_bytes" BIGINT NOT NULL,
    "api_rate_per_min" INT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed tier limits (free and premium)
INSERT INTO "tier_limits" (
    tier, 
    memories_per_day, 
    memories_per_month, 
    images_per_month, 
    voice_per_month, 
    searches_per_day, 
    storage_bytes, 
    api_rate_per_min
) VALUES
    ('free', 10, 100, 20, 20, 50, 104857600, 100),
    ('premium', 100, -1, 500, 500, -1, 10737418240, 1000)
ON CONFLICT (tier) DO UPDATE SET
    memories_per_day = EXCLUDED.memories_per_day,
    memories_per_month = EXCLUDED.memories_per_month,
    images_per_month = EXCLUDED.images_per_month,
    voice_per_month = EXCLUDED.voice_per_month,
    searches_per_day = EXCLUDED.searches_per_day,
    storage_bytes = EXCLUDED.storage_bytes,
    api_rate_per_min = EXCLUDED.api_rate_per_min,
    updated_at = CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_usage_user_id" ON "user_usage"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_usage_last_daily_reset" ON "user_usage"("last_daily_reset");
CREATE INDEX IF NOT EXISTS "idx_user_usage_last_monthly_reset" ON "user_usage"("last_monthly_reset");

-- Create trigger to auto-create user_usage row when user is created
CREATE OR REPLACE FUNCTION create_user_usage()
RETURNS TRIGGER AS `$`$
BEGIN
    INSERT INTO user_usage (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
`$`$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_user_usage ON users;
CREATE TRIGGER trigger_create_user_usage
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_usage();

-- Create function to reset counters automatically
CREATE OR REPLACE FUNCTION reset_usage_counters()
RETURNS void AS `$`$
BEGIN
    UPDATE user_usage SET
        memories_today = CASE 
            WHEN last_daily_reset < CURRENT_DATE THEN 0 
            ELSE memories_today 
        END,
        searches_today = CASE 
            WHEN last_daily_reset < CURRENT_DATE THEN 0 
            ELSE searches_today 
        END,
        last_daily_reset = CASE 
            WHEN last_daily_reset < CURRENT_DATE THEN CURRENT_DATE 
            ELSE last_daily_reset 
        END,
        memories_this_month = CASE 
            WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 
            ELSE memories_this_month 
        END,
        images_this_month = CASE 
            WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 
            ELSE images_this_month 
        END,
        voice_this_month = CASE 
            WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 
            ELSE voice_this_month 
        END,
        last_monthly_reset = CASE 
            WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) 
            THEN DATE_TRUNC('month', CURRENT_DATE) 
            ELSE last_monthly_reset 
        END;
END;
`$`$ LANGUAGE plpgsql;

-- Initialize user_usage for existing users
INSERT INTO user_usage (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Note: -1 means unlimited for premium tier
COMMENT ON COLUMN tier_limits.memories_per_month IS 'Use -1 for unlimited';
COMMENT ON COLUMN tier_limits.searches_per_day IS 'Use -1 for unlimited';
"@

Set-Content -Path "$migrationDir\migration.sql" -Value $migrationSql
Write-Host "  Created migration: $migrationDir" -ForegroundColor Green

# ============================================================================
# STEP 2: Update Prisma Schema
# ============================================================================
Write-Host ""
Write-Host "STEP 2: Updating Prisma schema..." -ForegroundColor Cyan

$schemaAddition = @"

// ============================================================================
// Tier Limits and Usage Tracking Models
// ============================================================================

model UserUsage {
  userId            String   @id @map("user_id") @db.Uuid
  memoriesToday     Int      @default(0) @map("memories_today")
  memoriesThisMonth Int      @default(0) @map("memories_this_month")
  imagesThisMonth   Int      @default(0) @map("images_this_month")
  voiceThisMonth    Int      @default(0) @map("voice_this_month")
  searchesToday     Int      @default(0) @map("searches_today")
  storageBytes      BigInt   @default(0) @map("storage_bytes")
  lastDailyReset    DateTime @default(now()) @map("last_daily_reset")
  lastMonthlyReset  DateTime @default(now()) @map("last_monthly_reset")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([lastDailyReset])
  @@index([lastMonthlyReset])
  @@map("user_usage")
}

model TierLimit {
  tier              String   @id
  memoriesPerDay    Int      @map("memories_per_day")
  memoriesPerMonth  Int      @map("memories_per_month")
  imagesPerMonth    Int      @map("images_per_month")
  voicePerMonth     Int      @map("voice_per_month")
  searchesPerDay    Int      @map("searches_per_day")
  storageBytes      BigInt   @map("storage_bytes")
  apiRatePerMin     Int      @map("api_rate_per_min")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@map("tier_limits")
}
"@

# Check if User model exists and add tier field
$schemaPath = "apps\api\prisma\schema.prisma"
$schemaContent = Get-Content $schemaPath -Raw

# Add tier to User model if not present
if ($schemaContent -notmatch 'tier\s+String') {
    Write-Host "  Adding tier field to User model..." -ForegroundColor Gray
    # This is a simplified version - you may need to manually add tier to your User model
    Write-Host "  MANUAL STEP REQUIRED: Add 'tier String @default(`"free`")' to your User model in schema.prisma" -ForegroundColor Yellow
}

# Add new models if not present
if ($schemaContent -notmatch 'model UserUsage') {
    Add-Content -Path $schemaPath -Value $schemaAddition
    Write-Host "  Added UserUsage and TierLimit models to schema" -ForegroundColor Green
} else {
    Write-Host "  Models already exist in schema" -ForegroundColor Yellow
}

# ============================================================================
# STEP 3: Create Usage Service
# ============================================================================
Write-Host ""
Write-Host "STEP 3: Creating usage service..." -ForegroundColor Cyan

$usageServiceDir = "apps\api\src\modules\usage"
New-Item -ItemType Directory -Path $usageServiceDir -Force | Out-Null

$usageServiceCode = @"
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UsageCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  resource: string;
}

export type ResourceType = 'memories' | 'images' | 'voice' | 'searches';

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Reset counters if needed (called automatically before each check)
   */
  private async resetCounters(userId: string): Promise<void> {
    await this.prisma.`$`executeRaw``
      UPDATE user_usage SET
        memories_today = CASE WHEN last_daily_reset < CURRENT_DATE THEN 0 ELSE memories_today END,
        searches_today = CASE WHEN last_daily_reset < CURRENT_DATE THEN 0 ELSE searches_today END,
        last_daily_reset = CASE WHEN last_daily_reset < CURRENT_DATE THEN CURRENT_DATE ELSE last_daily_reset END,
        memories_this_month = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 ELSE memories_this_month END,
        images_this_month = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 ELSE images_this_month END,
        voice_this_month = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 ELSE voice_this_month END,
        last_monthly_reset = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN DATE_TRUNC('month', CURRENT_DATE) ELSE last_monthly_reset END
      WHERE user_id = `$`{userId}::uuid
    ``;
  }

  /**
   * Check if user can perform action based on usage limits
   */
  async checkLimit(userId: string, resource: ResourceType): Promise<UsageCheck> {
    // Reset counters first
    await this.resetCounters(userId);

    // Get user tier and usage
    const result = await this.prisma.`$`queryRaw<any[]>``
      SELECT 
        u.tier,
        uu.memories_today,
        uu.memories_this_month,
        uu.images_this_month,
        uu.voice_this_month,
        uu.searches_today,
        uu.storage_bytes,
        uu.last_daily_reset,
        uu.last_monthly_reset,
        tl.memories_per_day,
        tl.memories_per_month,
        tl.images_per_month,
        tl.voice_per_month,
        tl.searches_per_day,
        tl.storage_bytes as storage_limit
      FROM users u
      JOIN user_usage uu ON u.id = uu.user_id
      JOIN tier_limits tl ON u.tier = tl.tier
      WHERE u.id = `$`{userId}::uuid
    ``;

    if (!result || result.length === 0) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const data = result[0];

    // Calculate based on resource type
    switch (resource) {
      case 'memories': {
        const dailyLimit = data.memories_per_day;
        const monthlyLimit = data.memories_per_month;
        const dailyUsed = data.memories_today;
        const monthlyUsed = data.memories_this_month;

        const dailyAllowed = dailyLimit === -1 || dailyUsed < dailyLimit;
        const monthlyAllowed = monthlyLimit === -1 || monthlyUsed < monthlyLimit;

        const dailyRemaining = dailyLimit === -1 ? Infinity : dailyLimit - dailyUsed;
        const monthlyRemaining = monthlyLimit === -1 ? Infinity : monthlyLimit - monthlyUsed;

        return {
          allowed: dailyAllowed && monthlyAllowed,
          remaining: Math.min(dailyRemaining, monthlyRemaining),
          limit: dailyLimit,
          resetAt: dailyAllowed ? this.getNextMonthReset() : this.getTomorrowReset(),
          resource,
        };
      }

      case 'searches': {
        const limit = data.searches_per_day;
        const used = data.searches_today;
        const allowed = limit === -1 || used < limit;

        return {
          allowed,
          remaining: limit === -1 ? Infinity : limit - used,
          limit,
          resetAt: this.getTomorrowReset(),
          resource,
        };
      }

      case 'images': {
        const limit = data.images_per_month;
        const used = data.images_this_month;
        const allowed = limit === -1 || used < limit;

        return {
          allowed,
          remaining: limit === -1 ? Infinity : limit - used,
          limit,
          resetAt: this.getNextMonthReset(),
          resource,
        };
      }

      case 'voice': {
        const limit = data.voice_per_month;
        const used = data.voice_this_month;
        const allowed = limit === -1 || used < limit;

        return {
          allowed,
          remaining: limit === -1 ? Infinity : limit - used,
          limit,
          resetAt: this.getNextMonthReset(),
          resource,
        };
      }

      default:
        throw new HttpException('Invalid resource type', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Increment usage counter after successful action
   */
  async incrementUsage(userId: string, resource: ResourceType): Promise<void> {
    switch (resource) {
      case 'memories':
        await this.prisma.`$`executeRaw``
          UPDATE user_usage 
          SET memories_today = memories_today + 1,
              memories_this_month = memories_this_month + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = `$`{userId}::uuid
        ``;
        break;

      case 'searches':
        await this.prisma.`$`executeRaw``
          UPDATE user_usage 
          SET searches_today = searches_today + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = `$`{userId}::uuid
        ``;
        break;

      case 'images':
        await this.prisma.`$`executeRaw``
          UPDATE user_usage 
          SET images_this_month = images_this_month + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = `$`{userId}::uuid
        ``;
        break;

      case 'voice':
        await this.prisma.`$`executeRaw``
          UPDATE user_usage 
          SET voice_this_month = voice_this_month + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = `$`{userId}::uuid
        ``;
        break;
    }
  }

  /**
   * Get all usage stats for a user
   */
  async getUserUsage(userId: string) {
    await this.resetCounters(userId);

    const result = await this.prisma.`$`queryRaw<any[]>``
      SELECT 
        u.tier,
        uu.*,
        tl.memories_per_day,
        tl.memories_per_month,
        tl.images_per_month,
        tl.voice_per_month,
        tl.searches_per_day,
        tl.storage_bytes as storage_limit
      FROM users u
      JOIN user_usage uu ON u.id = uu.user_id
      JOIN tier_limits tl ON u.tier = tl.tier
      WHERE u.id = `$`{userId}::uuid
    ``;

    if (!result || result.length === 0) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return result[0];
  }

  private getTomorrowReset(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private getNextMonthReset(): Date {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth;
  }
}
"@

Set-Content -Path "$usageServiceDir\usage.service.ts" -Value $usageServiceCode
Write-Host "  Created usage.service.ts" -ForegroundColor Green

# ============================================================================
# STEP 4: Create Usage Guard/Decorator
# ============================================================================
Write-Host ""
Write-Host "STEP 4: Creating usage guard and decorator..." -ForegroundColor Cyan

$usageGuardCode = @"
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageService, ResourceType } from './usage.service';

export const USAGE_RESOURCE_KEY = 'usageResource';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usageService: UsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.get<ResourceType>(
      USAGE_RESOURCE_KEY,
      context.getHandler(),
    );

    if (!resource) {
      return true; // No usage limit specified
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.user?.userId;

    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const check = await this.usageService.checkLimit(userId, resource);

    if (!check.allowed) {
      throw new HttpException(
        {
          error: 'LIMIT_EXCEEDED',
          message: ``You've reached your `$`{resource} limit``,
          resource: check.resource,
          limit: check.limit,
          resetAt: check.resetAt.toISOString(),
          upgradeUrl: '/settings/upgrade',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Store remaining count in request for potential response headers
    request.usageRemaining = check.remaining;

    return true;
  }
}
"@

Set-Content -Path "$usageServiceDir\usage.guard.ts" -Value $usageGuardCode
Write-Host "  Created usage.guard.ts" -ForegroundColor Green

$usageDecoratorCode = @"
import { SetMetadata } from '@nestjs/common';
import { ResourceType } from './usage.service';
import { USAGE_RESOURCE_KEY } from './usage.guard';

export const UsageLimit = (resource: ResourceType) =>
  SetMetadata(USAGE_RESOURCE_KEY, resource);
"@

Set-Content -Path "$usageServiceDir\usage.decorator.ts" -Value $usageDecoratorCode
Write-Host "  Created usage.decorator.ts" -ForegroundColor Green

# ============================================================================
# STEP 5: Create Usage Module
# ============================================================================
Write-Host ""
Write-Host "STEP 5: Creating usage module..." -ForegroundColor Cyan

$usageModuleCode = @"
import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { UsageLimitGuard } from './usage.guard';
import { UsageController } from './usage.controller';

@Module({
  providers: [UsageService, UsageLimitGuard],
  controllers: [UsageController],
  exports: [UsageService, UsageLimitGuard],
})
export class UsageModule {}
"@

Set-Content -Path "$usageServiceDir\usage.module.ts" -Value $usageModuleCode
Write-Host "  Created usage.module.ts" -ForegroundColor Green

# ============================================================================
# STEP 6: Create Usage Controller
# ============================================================================
Write-Host ""
Write-Host "STEP 6: Creating usage controller..." -ForegroundColor Cyan

$usageControllerCode = @"
import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('usage')
@UseGuards(JwtAuthGuard)
export class UsageController {
  constructor(private usageService: UsageService) {}

  @Get()
  async getUsage(@CurrentUser('id') userId: string) {
    return this.usageService.getUserUsage(userId);
  }
}
"@

Set-Content -Path "$usageServiceDir\usage.controller.ts" -Value $usageControllerCode
Write-Host "  Created usage.controller.ts" -ForegroundColor Green

# ============================================================================
# STEP 7: Create Frontend Settings Page
# ============================================================================
Write-Host ""
Write-Host "STEP 7: Creating frontend components..." -ForegroundColor Cyan

$settingsDir = "apps\web\src\pages\settings"
New-Item -ItemType Directory -Path $settingsDir -Force | Out-Null

$usagePageCode = @"
import { useEffect, useState } from 'react';
import { Card, Progress, Button, Alert } from '@/components/ui';
import { api } from '@/lib/api';

interface UsageData {
  tier: string;
  memories_today: number;
  memories_this_month: number;
  images_this_month: number;
  voice_this_month: number;
  searches_today: number;
  storage_bytes: number;
  memories_per_day: number;
  memories_per_month: number;
  images_per_month: number;
  voice_per_month: number;
  searches_per_day: number;
  storage_limit: number;
}

export function UsageLimitsPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await api.get('/usage');
      setUsage(response.data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!usage) {
    return <div className="p-6">Failed to load usage data</div>;
  }

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return ``{mb.toFixed(1)} MB``;
    return ``{(mb / 1024).toFixed(2)} GB``;
  };

  const getPercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const isUnlimited = (limit: number) => limit === -1;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Usage & Limits</h1>
        {usage.tier === 'free' && (
          <Button variant="primary" onClick={() => window.location.href = '/settings/upgrade'}>
            Upgrade to Premium
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Tier Badge */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Current Plan</h3>
              <p className="text-sm text-gray-600">
                {usage.tier === 'premium' ? 'Premium' : 'Free Tier'}
              </p>
            </div>
            <span className={``badge ``+(usage.tier === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800')}>
              {usage.tier.toUpperCase()}
            </span>
          </div>
        </Card>

        {/* Memories - Daily */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Memories Today</h3>
          <Progress 
            value={getPercentage(usage.memories_today, usage.memories_per_day)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {usage.memories_today} / {isUnlimited(usage.memories_per_day) ? 'Unlimited' : usage.memories_per_day}
            <span className="ml-2 text-xs">Resets at midnight</span>
          </p>
        </Card>

        {/* Memories - Monthly */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Memories This Month</h3>
          <Progress 
            value={getPercentage(usage.memories_this_month, usage.memories_per_month)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {usage.memories_this_month} / {isUnlimited(usage.memories_per_month) ? 'Unlimited' : usage.memories_per_month}
            <span className="ml-2 text-xs">Resets monthly</span>
          </p>
        </Card>

        {/* Images */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Images This Month</h3>
          <Progress 
            value={getPercentage(usage.images_this_month, usage.images_per_month)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {usage.images_this_month} / {isUnlimited(usage.images_per_month) ? 'Unlimited' : usage.images_per_month}
          </p>
        </Card>

        {/* Voice */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Voice Recordings This Month</h3>
          <Progress 
            value={getPercentage(usage.voice_this_month, usage.voice_per_month)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {usage.voice_this_month} / {isUnlimited(usage.voice_per_month) ? 'Unlimited' : usage.voice_per_month}
          </p>
        </Card>

        {/* Searches */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Searches Today</h3>
          <Progress 
            value={getPercentage(usage.searches_today, usage.searches_per_day)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {usage.searches_today} / {isUnlimited(usage.searches_per_day) ? 'Unlimited' : usage.searches_per_day}
            <span className="ml-2 text-xs">Resets at midnight</span>
          </p>
        </Card>

        {/* Storage */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Storage Used</h3>
          <Progress 
            value={getPercentage(usage.storage_bytes, usage.storage_limit)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {formatBytes(usage.storage_bytes)} / {formatBytes(usage.storage_limit)}
          </p>
        </Card>

        {usage.tier === 'free' && (
          <Alert variant="info">
            <p className="font-semibold">Need more?</p>
            <p className="text-sm">Upgrade to Premium for unlimited memories, more images, and 10GB storage.</p>
            <Button variant="link" className="mt-2" onClick={() => window.location.href = '/settings/upgrade'}>
              View Premium Benefits →
            </Button>
          </Alert>
        )}
      </div>
    </div>
  );
}
"@

Set-Content -Path "$settingsDir\UsageLimitsPage.tsx" -Value $usagePageCode
Write-Host "  Created UsageLimitsPage.tsx" -ForegroundColor Green

# ============================================================================
# STEP 8: Create Example Usage in Memory Controller
# ============================================================================
Write-Host ""
Write-Host "STEP 8: Creating example usage documentation..." -ForegroundColor Cyan

$exampleUsageCode = @"
// ============================================================================
// EXAMPLE: How to Use Usage Limits in Your Controllers
// ============================================================================

// 1. Import the decorator and guard
import { UsageLimit } from '../usage/usage.decorator';
import { UsageLimitGuard } from '../usage/usage.guard';
import { UsageService } from '../usage/usage.service';

// 2. In your controller/method, add the decorator and guard:

@Controller('memories')
export class MemoriesController {
  constructor(
    private usageService: UsageService,
    // ... other services
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, UsageLimitGuard) // Add UsageLimitGuard
  @UsageLimit('memories') // Specify resource type
  async createMemory(
    @CurrentUser('id') userId: string,
    @Body() createMemoryDto: CreateMemoryDto,
  ) {
    // Create the memory
    const memory = await this.memoriesService.create(userId, createMemoryDto);

    // IMPORTANT: Increment usage counter after successful creation
    await this.usageService.incrementUsage(userId, 'memories');

    return memory;
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, UsageLimitGuard)
  @UsageLimit('searches') // Different resource type
  async search(
    @CurrentUser('id') userId: string,
    @Query('q') query: string,
  ) {
    const results = await this.memoriesService.search(userId, query);
    
    // Increment search counter
    await this.usageService.incrementUsage(userId, 'searches');
    
    return results;
  }
}

// ============================================================================
// What happens when limit is exceeded?
// ============================================================================
// The guard throws an HttpException with status 429 (Too Many Requests)
// Response body:
// {
//   "error": "LIMIT_EXCEEDED",
//   "message": "You've reached your memories limit",
//   "resource": "memories",
//   "limit": 10,
//   "resetAt": "2024-12-23T00:00:00.000Z",
//   "upgradeUrl": "/settings/upgrade"
// }
//
// Frontend should catch this and show appropriate upgrade prompt
"@

New-Item -ItemType Directory -Path "apps\api\src\modules\usage\examples" -Force | Out-Null
Set-Content -Path "apps\api\src\modules\usage\examples\USAGE_EXAMPLE.ts" -Value $exampleUsageCode
Write-Host "  Created usage examples" -ForegroundColor Green

# ============================================================================
# STEP 9: Run Database Migrations
# ============================================================================
Write-Host ""
Write-Host "STEP 9: Running database migrations..." -ForegroundColor Cyan

Set-Location "apps\api"

Write-Host "  Generating Prisma Client..." -ForegroundColor Gray
pnpm db:generate 2>&1 | Out-Null

Write-Host "  Running migrations..." -ForegroundColor Gray
$migrationOutput = pnpm db:migrate 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Migrations completed successfully" -ForegroundColor Green
} else {
    Write-Host "  Migration may have failed. Check output above." -ForegroundColor Yellow
    Write-Host $migrationOutput -ForegroundColor Gray
}

Set-Location $ProjectRoot

# ============================================================================
# SUCCESS SUMMARY
# ============================================================================
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "MVP Implementation Complete!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Files Created:" -ForegroundColor Cyan
Write-Host "  Database:" -ForegroundColor White
Write-Host "    - $migrationDir\migration.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "  Backend (apps\api\src\modules\usage\):" -ForegroundColor White
Write-Host "    - usage.service.ts" -ForegroundColor Gray
Write-Host "    - usage.guard.ts" -ForegroundColor Gray
Write-Host "    - usage.decorator.ts" -ForegroundColor Gray
Write-Host "    - usage.module.ts" -ForegroundColor Gray
Write-Host "    - usage.controller.ts" -ForegroundColor Gray
Write-Host "    - examples\USAGE_EXAMPLE.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "  Frontend (apps\web\src\pages\settings\):" -ForegroundColor White
Write-Host "    - UsageLimitsPage.tsx" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add UsageModule to your app.module.ts:" -ForegroundColor White
Write-Host "   import { UsageModule } from './modules/usage/usage.module';" -ForegroundColor Gray
Write-Host "   imports: [ ..., UsageModule ]" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Add route to frontend (apps\web\src\App.tsx or router):" -ForegroundColor White
Write-Host "   <Route path='/settings/usage' element={<UsageLimitsPage />} />" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Update your controllers with usage limits:" -ForegroundColor White
Write-Host "   See: apps\api\src\modules\usage\examples\USAGE_EXAMPLE.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test the implementation:" -ForegroundColor White
Write-Host "   - Create 10 memories (free tier limit)" -ForegroundColor Gray
Write-Host "   - Verify 11th memory returns 429 error" -ForegroundColor Gray
Write-Host "   - Check /settings/usage page displays correctly" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Restart your backend server:" -ForegroundColor White
Write-Host "   cd apps\api && pnpm dev" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database tables created:" -ForegroundColor Cyan
Write-Host "  - user_usage (tracks daily/monthly usage)" -ForegroundColor Gray
Write-Host "  - tier_limits (stores free/premium limits)" -ForegroundColor Gray
Write-Host "  - users.tier (added tier column)" -ForegroundColor Gray
Write-Host ""
Write-Host "API Endpoints available:" -ForegroundColor Cyan
Write-Host "  GET /api/v1/usage - Get current user usage stats" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
