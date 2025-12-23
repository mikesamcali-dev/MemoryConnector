# Memory Connector - MVP Implementation Guide

> **Version**: 1.0  
> **Status**: Ready for Implementation  
> **Purpose**: Production-ready code, schemas, and specifications for MVP rollout

---

## Table of Contents

1. [Tier Limits](#1-free-and-premium-tier-limits)
2. [AI Cost Guardrails](#2-ai-cost-guardrails)
3. [Idempotency & Duplicate Protection](#3-idempotency-and-duplicate-save-protection)
4. [Keyword Search Fallback](#4-keyword-search-fallback)
5. [pgvector Indexing & Partitioning](#5-pgvector-indexing-and-partitioning)
6. [In-App Reminder Inbox](#6-in-app-reminder-inbox)
7. [Offline Conflict UI](#7-offline-conflict-ui-copy)
8. [Operational Runbooks](#8-operational-runbooks)
9. [IndexedDB Device Testing](#9-indexeddb-device-testing)
10. [Near-Duplicate Soft Launch](#10-near-duplicate-detection-soft-launch)

---

## 1. Free and Premium Tier Limits

### 1.1 Limit Definitions

| Resource | Free Tier | Premium Tier | Enforcement |
|----------|-----------|--------------|-------------|
| Memories per day | 10 | 100 | Hard block |
| Memories per month | 100 | Unlimited | Hard block |
| Images per month | 20 | 500 | Hard block |
| Voice recordings per month | 20 | 500 | Hard block |
| Searches per day | 50 | Unlimited | Soft block + upgrade prompt |
| Storage total | 100 MB | 10 GB | Soft block |
| API rate limit | 100 req/min | 1000 req/min | 429 response |

### 1.2 Database Schema

```sql
-- User usage tracking table
CREATE TABLE user_usage (
  user_id UUID PRIMARY KEY REFERENCES users(user_id),
  memories_today INT DEFAULT 0,
  memories_this_month INT DEFAULT 0,
  images_this_month INT DEFAULT 0,
  voice_this_month INT DEFAULT 0,
  searches_today INT DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  last_daily_reset TIMESTAMP DEFAULT CURRENT_DATE,
  last_monthly_reset TIMESTAMP DEFAULT DATE_TRUNC('month', CURRENT_DATE)
);

-- Tier limits configuration (for admin updates without deploy)
CREATE TABLE tier_limits (
  tier VARCHAR(20) PRIMARY KEY,
  memories_per_day INT NOT NULL,
  memories_per_month INT NOT NULL,
  images_per_month INT NOT NULL,
  voice_per_month INT NOT NULL,
  searches_per_day INT NOT NULL,
  storage_bytes BIGINT NOT NULL,
  api_rate_per_min INT NOT NULL
);

INSERT INTO tier_limits VALUES
  ('free', 10, 100, 20, 20, 50, 104857600, 100),
  ('premium', 100, -1, 500, 500, -1, 10737418240, 1000);
-- Note: -1 means unlimited
```

### 1.3 Server-Side Enforcement Middleware

```typescript
// middleware/usageLimits.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

interface UsageCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

export async function checkUsageLimit(
  userId: string,
  resource: 'memories' | 'images' | 'voice' | 'searches'
): Promise<UsageCheck> {
  // Reset counters if needed
  await db.query(`
    UPDATE user_usage SET
      memories_today = CASE WHEN last_daily_reset < CURRENT_DATE THEN 0 ELSE memories_today END,
      searches_today = CASE WHEN last_daily_reset < CURRENT_DATE THEN 0 ELSE searches_today END,
      last_daily_reset = CASE WHEN last_daily_reset < CURRENT_DATE THEN CURRENT_DATE ELSE last_daily_reset END,
      memories_this_month = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 ELSE memories_this_month END,
      images_this_month = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 ELSE images_this_month END,
      voice_this_month = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 ELSE voice_this_month END,
      last_monthly_reset = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN DATE_TRUNC('month', CURRENT_DATE) ELSE last_monthly_reset END
    WHERE user_id = $1
  `, [userId]);

  const result = await db.query(`
    SELECT u.tier, uu.*, tl.*
    FROM users u
    JOIN user_usage uu ON u.user_id = uu.user_id
    JOIN tier_limits tl ON u.tier = tl.tier
    WHERE u.user_id = $1
  `, [userId]);

  const { tier, ...usage } = result.rows[0];
  const limits = result.rows[0];

  switch (resource) {
    case 'memories':
      const dailyAllowed = limits.memories_per_day === -1 || usage.memories_today < limits.memories_per_day;
      const monthlyAllowed = limits.memories_per_month === -1 || usage.memories_this_month < limits.memories_per_month;
      return {
        allowed: dailyAllowed && monthlyAllowed,
        remaining: Math.min(
          limits.memories_per_day === -1 ? Infinity : limits.memories_per_day - usage.memories_today,
          limits.memories_per_month === -1 ? Infinity : limits.memories_per_month - usage.memories_this_month
        ),
        limit: limits.memories_per_day,
        resetAt: dailyAllowed ? getNextMonthReset() : getTomorrowReset()
      };
    case 'images':
      return {
        allowed: limits.images_per_month === -1 || usage.images_this_month < limits.images_per_month,
        remaining: limits.images_per_month === -1 ? Infinity : limits.images_per_month - usage.images_this_month,
        limit: limits.images_per_month,
        resetAt: getNextMonthReset()
      };
    case 'voice':
      return {
        allowed: limits.voice_per_month === -1 || usage.voice_this_month < limits.voice_per_month,
        remaining: limits.voice_per_month === -1 ? Infinity : limits.voice_per_month - usage.voice_this_month,
        limit: limits.voice_per_month,
        resetAt: getNextMonthReset()
      };
    case 'searches':
      return {
        allowed: limits.searches_per_day === -1 || usage.searches_today < limits.searches_per_day,
        remaining: limits.searches_per_day === -1 ? Infinity : limits.searches_per_day - usage.searches_today,
        limit: limits.searches_per_day,
        resetAt: getTomorrowReset()
      };
    default:
      return { allowed: true, remaining: Infinity, limit: -1, resetAt: new Date() };
  }
}

function getTomorrowReset(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

function getNextMonthReset(): Date {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function usageLimitMiddleware(resource: 'memories' | 'images' | 'voice' | 'searches') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const check = await checkUsageLimit(req.userId, resource);
    if (!check.allowed) {
      return res.status(429).json({
        error: 'LIMIT_EXCEEDED',
        resource,
        limit: check.limit,
        resetAt: check.resetAt.toISOString(),
        upgradeUrl: '/settings/upgrade'
      });
    }
    req.usageRemaining = check.remaining;
    next();
  };
}

export async function incrementUsage(
  userId: string,
  resource: 'memories' | 'images' | 'voice' | 'searches',
  amount: number = 1
): Promise<void> {
  const column = {
    memories: 'memories_today, memories_this_month',
    images: 'images_this_month',
    voice: 'voice_this_month',
    searches: 'searches_today'
  }[resource];

  if (resource === 'memories') {
    await db.query(
      `UPDATE user_usage SET memories_today = memories_today + $2, memories_this_month = memories_this_month + $2 WHERE user_id = $1`,
      [userId, amount]
    );
  } else {
    await db.query(
      `UPDATE user_usage SET ${column} = ${column} + $2 WHERE user_id = $1`,
      [userId, amount]
    );
  }
}
```

### 1.4 Usage in Routes

```typescript
// routes/memories.ts
import { Router } from 'express';
import { usageLimitMiddleware, incrementUsage } from '../middleware/usageLimits';

const router = Router();

router.post('/', 
  usageLimitMiddleware('memories'),
  async (req, res) => {
    // Create memory logic...
    const memory = await createMemory(req.userId, req.body);
    
    // Increment usage after successful creation
    await incrementUsage(req.userId, 'memories');
    
    res.status(201).json(memory);
  }
);

router.get('/search',
  usageLimitMiddleware('searches'),
  async (req, res) => {
    const results = await searchMemories(req.userId, req.query.q);
    await incrementUsage(req.userId, 'searches');
    res.json(results);
  }
);

export default router;
```

### 1.5 UI: Limit Reached Messages

```typescript
// constants/limitMessages.ts
export const LIMIT_MESSAGES = {
  memories_daily: {
    title: "Daily Limit Reached",
    message: "You've reached your daily limit of {limit} memories. You can save more tomorrow, or upgrade to Premium for {premiumLimit} memories per day.",
    actions: ["Upgrade", "Dismiss"]
  },
  memories_monthly: {
    title: "Monthly Limit Reached", 
    message: "You've saved {limit} memories this month — that's your free tier limit. Upgrade to Premium for unlimited memories.",
    actions: ["Upgrade", "Dismiss"]
  },
  searches: {
    title: "Search Limit Reached",
    message: "You've used all {limit} searches for today. Searches reset at midnight, or upgrade for unlimited searching.",
    actions: ["Upgrade", "OK"]
  },
  storage: {
    title: "Storage Full",
    message: "You're out of storage space ({limit}). Delete some memories or images, or upgrade for 10 GB of storage.",
    actions: ["Manage Storage", "Upgrade"]
  },
  images: {
    title: "Image Limit Reached",
    message: "You've uploaded {limit} images this month. Upgrade to Premium for 500 images per month.",
    actions: ["Upgrade", "OK"]
  },
  voice: {
    title: "Voice Recording Limit Reached",
    message: "You've recorded {limit} voice memories this month. Upgrade to Premium for 500 recordings per month.",
    actions: ["Upgrade", "OK"]
  }
};
```

### 1.6 React Component: Limit Warning Modal

```tsx
// components/LimitWarningModal.tsx
import React from 'react';
import { LIMIT_MESSAGES } from '../constants/limitMessages';

interface LimitWarningModalProps {
  resource: keyof typeof LIMIT_MESSAGES;
  limit: number;
  premiumLimit?: number;
  resetAt: string;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function LimitWarningModal({
  resource,
  limit,
  premiumLimit,
  resetAt,
  onUpgrade,
  onDismiss
}: LimitWarningModalProps) {
  const config = LIMIT_MESSAGES[resource];
  const message = config.message
    .replace('{limit}', limit.toString())
    .replace('{premiumLimit}', premiumLimit?.toString() || 'unlimited');

  const resetDate = new Date(resetAt);
  const resetText = resetDate.toDateString() === new Date().toDateString()
    ? 'midnight tonight'
    : resetDate.toLocaleDateString();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{config.title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <p className="text-sm text-gray-500 mb-6">Resets {resetText}</p>
        
        <div className="flex gap-3">
          {config.actions.includes("Upgrade") && (
            <button
              onClick={onUpgrade}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              Upgrade
            </button>
          )}
          <button
            onClick={onDismiss}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200"
          >
            {config.actions.find(a => a !== "Upgrade") || "Dismiss"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 2. AI Cost Guardrails

### 2.1 Configuration

```typescript
// config/aiCostConfig.ts
export const AI_COST_CONFIG = {
  // Per-user daily limits (prevents runaway usage)
  perUserDailyEmbeddings: 100,      // ~$0.002/day max per user
  perUserDailyClassifications: 50,   // ~$0.375/day max per user

  // Global daily budget in cents
  globalDailyBudgetCents: 10000,     // $100/day

  // Alert thresholds (percent of daily budget)
  alertThresholds: [50, 80, 100],

  // Circuit breaker: disable AI when budget exceeded
  circuitBreakerEnabled: true,

  // Fallback behavior when circuit open
  // 'queue' = accept saves, queue enrichment for later
  // 'skip' = save without enrichment
  // 'local-only' = use on-device classification only
  fallbackMode: 'queue' as 'queue' | 'skip' | 'local-only',

  // Cost per operation (in cents, for tracking)
  costs: {
    embedding: 0.002,      // ~200 tokens × $0.0001/1K
    classification: 0.75,  // ~500 tokens × $0.015/1K (gpt-3.5-turbo)
    searchQuery: 0.0005,   // ~50 tokens × $0.0001/1K
  }
};
```

### 2.2 Database Schema

```sql
-- AI cost tracking table
CREATE TABLE ai_cost_tracking (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES users(user_id),
  operation VARCHAR(50) NOT NULL, -- 'embedding', 'classification', 'search_query'
  tokens_used INT NOT NULL,
  cost_cents DECIMAL(10,4) NOT NULL,
  model VARCHAR(100) NOT NULL,
  memory_id UUID REFERENCES memories(memory_id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_cost_date ON ai_cost_tracking(date);
CREATE INDEX idx_ai_cost_user_date ON ai_cost_tracking(user_id, date);

-- Materialized view for fast budget checks
CREATE MATERIALIZED VIEW daily_ai_spend AS
SELECT
  date,
  SUM(cost_cents) as total_cents,
  COUNT(*) as operation_count,
  COUNT(DISTINCT user_id) as unique_users
FROM ai_cost_tracking
WHERE date = CURRENT_DATE
GROUP BY date;

CREATE UNIQUE INDEX idx_daily_ai_spend_date ON daily_ai_spend(date);

-- Refresh every minute via pg_cron
SELECT cron.schedule('refresh-ai-spend', '* * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_ai_spend');
```

### 2.3 Circuit Breaker Implementation

```typescript
// services/aiCircuitBreaker.ts
import Redis from 'ioredis';
import { AI_COST_CONFIG } from '../config/aiCostConfig';
import { alertSlack } from './alerting';
import { db } from '../db';
import { logger } from '../utils/logger';

const redis = new Redis(process.env.REDIS_URL!);

const CIRCUIT_KEY = 'ai:circuit:status';
const SPEND_KEY = 'ai:daily:spend';

export enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Blocked - budget exceeded
  QUEUE_ONLY = 'queue'    // Accepting but queueing for later
}

export async function getCircuitState(): Promise<CircuitState> {
  const state = await redis.get(CIRCUIT_KEY);
  return (state as CircuitState) || CircuitState.CLOSED;
}

export async function setCircuitState(state: CircuitState, ttlSeconds?: number): Promise<void> {
  if (ttlSeconds) {
    await redis.set(CIRCUIT_KEY, state, 'EX', ttlSeconds);
  } else {
    await redis.set(CIRCUIT_KEY, state);
  }
  logger.info({ state }, 'Circuit breaker state changed');
}

function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

function getMidnightTimestamp(): number {
  const midnight = new Date();
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  return Math.floor(midnight.getTime() / 1000);
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export async function recordAICost(
  userId: string,
  operation: 'embedding' | 'classification' | 'search_query',
  tokens: number,
  costCents: number,
  model: string,
  memoryId?: string
): Promise<void> {
  // Record to database
  await db.query(
    `INSERT INTO ai_cost_tracking (user_id, operation, tokens_used, cost_cents, model, memory_id) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, operation, tokens, costCents, model, memoryId]
  );

  // Update Redis counter (expires at midnight)
  const newTotal = await redis.incrbyfloat(SPEND_KEY, costCents);
  await redis.expireat(SPEND_KEY, getMidnightTimestamp());

  // Check thresholds
  const percentUsed = (newTotal / AI_COST_CONFIG.globalDailyBudgetCents) * 100;

  for (const threshold of AI_COST_CONFIG.alertThresholds) {
    const alertKey = `ai:alert:${threshold}:${getTodayKey()}`;
    const alreadyAlerted = await redis.exists(alertKey);
    
    if (percentUsed >= threshold && !alreadyAlerted) {
      await redis.set(alertKey, '1', 'EX', 86400);
      
      await alertSlack({
        channel: '#ai-costs',
        severity: threshold >= 100 ? 'critical' : 'warning',
        message: `AI spend at ${threshold}% of daily budget ($${(newTotal/100).toFixed(2)}/$${(AI_COST_CONFIG.globalDailyBudgetCents/100).toFixed(2)})`
      });

      // Trip circuit breaker at 100%
      if (threshold >= 100 && AI_COST_CONFIG.circuitBreakerEnabled) {
        await setCircuitState(CircuitState.OPEN, getSecondsUntilMidnight());
        
        await alertSlack({
          channel: '#ai-costs',
          severity: 'critical',
          message: '🚨 AI CIRCUIT BREAKER TRIPPED - Enrichment disabled until midnight'
        });
      }
    }
  }
}

export async function canProcessAI(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  circuitState: CircuitState;
}> {
  const circuitState = await getCircuitState();
  
  if (circuitState === CircuitState.OPEN) {
    return { 
      allowed: false, 
      reason: 'Circuit breaker open - daily budget exceeded',
      circuitState 
    };
  }

  // Check per-user daily limit
  const userToday = await db.query(
    `SELECT 
       COUNT(*) FILTER (WHERE operation = 'classification') as classifications,
       COUNT(*) FILTER (WHERE operation = 'embedding') as embeddings
     FROM ai_cost_tracking 
     WHERE user_id = $1 AND date = CURRENT_DATE`,
    [userId]
  );

  const { classifications, embeddings } = userToday.rows[0];

  if (classifications >= AI_COST_CONFIG.perUserDailyClassifications) {
    return {
      allowed: false,
      reason: 'Per-user daily classification limit reached',
      circuitState
    };
  }

  if (embeddings >= AI_COST_CONFIG.perUserDailyEmbeddings) {
    return {
      allowed: false,
      reason: 'Per-user daily embedding limit reached',
      circuitState
    };
  }

  return { allowed: true, circuitState };
}

export async function getDailySpendSummary(): Promise<{
  totalCents: number;
  percentUsed: number;
  operationCount: number;
  circuitState: CircuitState;
}> {
  const totalCents = parseFloat(await redis.get(SPEND_KEY) || '0');
  const circuitState = await getCircuitState();
  
  const stats = await db.query(
    `SELECT COUNT(*) as operation_count FROM ai_cost_tracking WHERE date = CURRENT_DATE`
  );

  return {
    totalCents,
    percentUsed: (totalCents / AI_COST_CONFIG.globalDailyBudgetCents) * 100,
    operationCount: parseInt(stats.rows[0].operation_count),
    circuitState
  };
}
```

### 2.4 Enrichment Queue with Circuit Breaker

```typescript
// services/enrichmentQueue.ts
import { SQS } from 'aws-sdk';
import { getCircuitState, CircuitState, canProcessAI } from './aiCircuitBreaker';
import { db } from '../db';
import { logger } from '../utils/logger';

const sqs = new SQS();

interface EnrichmentJob {
  memoryId: string;
  userId: string;
  queuedAt: number;
  priority: 'normal' | 'deferred';
}

export async function enqueueEnrichment(
  memoryId: string, 
  userId: string
): Promise<{ queued: boolean; reason?: string }> {
  const { allowed, reason, circuitState } = await canProcessAI(userId);

  if (!allowed || circuitState === CircuitState.OPEN) {
    // Queue for later processing
    await sqs.sendMessage({
      QueueUrl: process.env.ENRICHMENT_QUEUE_URL!,
      MessageBody: JSON.stringify({
        memoryId,
        userId,
        queuedAt: Date.now()
      } as EnrichmentJob),
      MessageAttributes: {
        'priority': { DataType: 'String', StringValue: 'deferred' }
      }
    }).promise();

    // Update memory state
    await db.query(
      `UPDATE memories SET enrichment_status = 'queued_budget', enrichment_queued_at = NOW() 
       WHERE memory_id = $1`,
      [memoryId]
    );

    logger.info({ memoryId, userId, reason }, 'Enrichment queued due to limits');
    return { queued: true, reason };
  }

  // Process normally
  await sqs.sendMessage({
    QueueUrl: process.env.ENRICHMENT_QUEUE_URL!,
    MessageBody: JSON.stringify({
      memoryId,
      userId,
      queuedAt: Date.now()
    } as EnrichmentJob),
    MessageAttributes: {
      'priority': { DataType: 'String', StringValue: 'normal' }
    }
  }).promise();

  return { queued: false };
}

// Worker that processes enrichment queue
export async function processEnrichmentJob(job: EnrichmentJob): Promise<void> {
  const { allowed, circuitState } = await canProcessAI(job.userId);

  if (!allowed && job.priority === 'normal') {
    // Re-queue as deferred
    logger.info({ job }, 'Re-queueing job as deferred');
    await sqs.sendMessage({
      QueueUrl: process.env.ENRICHMENT_QUEUE_URL!,
      MessageBody: JSON.stringify({ ...job, priority: 'deferred' }),
      DelaySeconds: 300 // 5 minute delay
    }).promise();
    return;
  }

  if (circuitState === CircuitState.OPEN) {
    // Re-queue with longer delay
    await sqs.sendMessage({
      QueueUrl: process.env.ENRICHMENT_QUEUE_URL!,
      MessageBody: JSON.stringify(job),
      DelaySeconds: 900 // 15 minute delay
    }).promise();
    return;
  }

  // Process the enrichment
  await performEnrichment(job.memoryId, job.userId);
}
```

### 2.5 Alerting Service

```typescript
// services/alerting.ts
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface AlertOptions {
  channel: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: Record<string, any>;
}

const SEVERITY_EMOJI = {
  info: 'ℹ️',
  warning: '⚠️',
  critical: '🚨'
};

export async function alertSlack(options: AlertOptions): Promise<void> {
  const emoji = SEVERITY_EMOJI[options.severity];
  
  await slack.chat.postMessage({
    channel: options.channel,
    text: `${emoji} ${options.message}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${options.severity.toUpperCase()}*: ${options.message}`
        }
      },
      ...(options.details ? [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '```' + JSON.stringify(options.details, null, 2) + '```'
        }
      }] : [])
    ]
  });
}
```

---

## 3. Idempotency and Duplicate-Save Protection

### 3.1 Idempotency Key Generation (Client)

```typescript
// utils/idempotency.ts (client-side)
export function generateIdempotencyKey(): string {
  return `${crypto.randomUUID()}-${Date.now()}`;
}

// Store with the draft to ensure same key on retries
export interface MemoryDraft {
  text?: string;
  imageUrl?: string;
  idempotencyKey: string;
  createdAt: number;
}

export function createDraft(text?: string, imageUrl?: string): MemoryDraft {
  return {
    text,
    imageUrl,
    idempotencyKey: generateIdempotencyKey(),
    createdAt: Date.now()
  };
}
```

### 3.2 API Client with Idempotency

```typescript
// api/memories.ts (client-side)
import { MemoryDraft } from '../utils/idempotency';

export async function saveMemory(draft: MemoryDraft): Promise<Memory> {
  const response = await fetch('/api/v1/memories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': draft.idempotencyKey
    },
    body: JSON.stringify({
      text_content: draft.text,
      image_url: draft.imageUrl
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.error, response.status, error);
  }

  // Check if this was a replayed response
  const replayed = response.headers.get('X-Idempotency-Replayed') === 'true';
  if (replayed) {
    console.log('Idempotent replay detected - returning cached response');
  }

  return response.json();
}
```

### 3.3 Server-Side Idempotency Table

```sql
-- Idempotency keys table
CREATE TABLE idempotency_keys (
  idempotency_key VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id),
  endpoint VARCHAR(100) NOT NULL,
  request_hash VARCHAR(64), -- SHA-256 of request body
  response_status INT,
  response_body JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_idempotency_user ON idempotency_keys(user_id);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- Cleanup job (hourly)
SELECT cron.schedule('cleanup-idempotency', '0 * * * *',
  $$DELETE FROM idempotency_keys WHERE expires_at < NOW()$$);
```

### 3.4 Idempotency Middleware

```typescript
// middleware/idempotency.ts
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { db } from '../db';
import { logger } from '../utils/logger';

export async function idempotencyMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  const key = req.headers['idempotency-key'] as string;
  
  // No key = no idempotency protection
  if (!key) {
    return next();
  }

  const userId = req.userId;
  const endpoint = `${req.method}:${req.path}`;
  const requestHash = createHash('sha256')
    .update(JSON.stringify(req.body))
    .digest('hex');

  // Check for existing key
  const existing = await db.query(
    `SELECT response_status, response_body, request_hash 
     FROM idempotency_keys 
     WHERE idempotency_key = $1 AND user_id = $2`,
    [key, userId]
  );

  if (existing.rows.length > 0) {
    const { response_status, response_body, request_hash: storedHash } = existing.rows[0];
    
    // Verify request body matches (prevent key reuse with different data)
    if (storedHash && storedHash !== requestHash) {
      logger.warn({ key, userId }, 'Idempotency key reused with different request body');
      return res.status(422).json({
        error: 'IDEMPOTENCY_KEY_REUSED',
        message: 'This idempotency key was already used with a different request'
      });
    }
    
    // Return cached response
    res.setHeader('X-Idempotency-Replayed', 'true');
    return res.status(response_status).json(response_body);
  }

  // Reserve the key (prevents race conditions)
  try {
    await db.query(
      `INSERT INTO idempotency_keys (idempotency_key, user_id, endpoint, request_hash) 
       VALUES ($1, $2, $3, $4)`,
      [key, userId, endpoint, requestHash]
    );
  } catch (e: any) {
    if (e.code === '23505') { // Unique violation - concurrent request
      return res.status(409).json({
        error: 'DUPLICATE_REQUEST',
        message: 'Request already in progress'
      });
    }
    throw e;
  }

  // Capture response to store
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    // Store response asynchronously (don't block)
    db.query(
      `UPDATE idempotency_keys 
       SET response_status = $1, response_body = $2 
       WHERE idempotency_key = $3`,
      [res.statusCode, body, key]
    ).catch(err => logger.error({ err, key }, 'Failed to store idempotency response'));
    
    return originalJson(body);
  };

  next();
}
```

### 3.5 Content-Based Deduplication

```typescript
// services/duplicateDetection.ts
import { createHash } from 'crypto';
import { db } from '../db';

export function computeContentHash(text: string, imageUrl?: string): string {
  const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
  const content = `${normalizedText}|${imageUrl || ''}`;
  return createHash('sha256').update(content).digest('hex').slice(0, 32);
}

export async function checkRecentDuplicate(
  userId: string,
  contentHash: string,
  windowSeconds: number = 60
): Promise<{ isDuplicate: boolean; existingMemoryId?: string }> {
  const result = await db.query(
    `SELECT memory_id FROM memories 
     WHERE user_id = $1 
     AND content_hash = $2 
     AND created_at > NOW() - INTERVAL '${windowSeconds} seconds'
     AND state != 'DELETED'
     LIMIT 1`,
    [userId, contentHash]
  );

  if (result.rows.length > 0) {
    return { isDuplicate: true, existingMemoryId: result.rows[0].memory_id };
  }
  return { isDuplicate: false };
}
```

### 3.6 Memory Schema Update

```sql
-- Add content hash column to memories
ALTER TABLE memories ADD COLUMN content_hash VARCHAR(32);

CREATE INDEX idx_memories_content_hash ON memories(user_id, content_hash, created_at)
  WHERE state != 'DELETED';
```

### 3.7 Combined Usage in Create Memory Endpoint

```typescript
// routes/memories.ts
import { Router } from 'express';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { usageLimitMiddleware, incrementUsage } from '../middleware/usageLimits';
import { computeContentHash, checkRecentDuplicate } from '../services/duplicateDetection';
import { enqueueEnrichment } from '../services/enrichmentQueue';

const router = Router();

router.post('/',
  idempotencyMiddleware,
  usageLimitMiddleware('memories'),
  async (req, res) => {
    const { text_content, image_url } = req.body;
    const userId = req.userId;

    // Check for content-based duplicate
    const contentHash = computeContentHash(text_content || '', image_url);
    const { isDuplicate, existingMemoryId } = await checkRecentDuplicate(userId, contentHash);

    if (isDuplicate) {
      return res.status(409).json({
        error: 'DUPLICATE_CONTENT',
        message: 'This memory was already saved in the last minute',
        existingMemoryId
      });
    }

    // Create the memory
    const result = await db.query(
      `INSERT INTO memories (memory_id, user_id, text_content, image_url, content_hash, state)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'SAVED')
       RETURNING *`,
      [userId, text_content, image_url, contentHash]
    );

    const memory = result.rows[0];

    // Increment usage
    await incrementUsage(userId, 'memories');

    // Queue for enrichment (handles circuit breaker internally)
    const { queued, reason } = await enqueueEnrichment(memory.memory_id, userId);

    res.status(201).json({
      ...memory,
      enrichment_queued: queued,
      enrichment_note: queued ? 'Classification will be processed when capacity is available' : undefined
    });
  }
);

export default router;
```

---

## 4. Keyword Search Fallback

### 4.1 Full-Text Search Setup

```sql
-- Add tsvector column for full-text search
ALTER TABLE memories ADD COLUMN text_search_vector TSVECTOR;

-- Populate existing data
UPDATE memories 
SET text_search_vector = to_tsvector('english', COALESCE(text_content, ''));

-- Create GIN index for fast full-text search
CREATE INDEX idx_memories_fts ON memories USING GIN(text_search_vector);

-- Trigger to auto-update on insert/update
CREATE OR REPLACE FUNCTION update_text_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.text_search_vector := to_tsvector('english', COALESCE(NEW.text_content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memories_text_search_update
  BEFORE INSERT OR UPDATE OF text_content ON memories
  FOR EACH ROW EXECUTE FUNCTION update_text_search_vector();
```

### 4.2 Search Service with Automatic Fallback

```typescript
// services/searchService.ts
import { db } from '../db';
import { generateQueryEmbedding } from './embeddingService';
import { logger } from '../utils/logger';

export interface SearchResult {
  memories: Memory[];
  method: 'semantic' | 'keyword';
  degraded: boolean;
  query: string;
  totalCount: number;
}

export async function searchMemories(
  userId: string,
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResult> {
  // Try semantic search first
  try {
    const embedding = await generateQueryEmbedding(query);
    const results = await semanticSearch(userId, embedding, limit, offset);
    
    return {
      memories: results.memories,
      method: 'semantic',
      degraded: false,
      query,
      totalCount: results.totalCount
    };
  } catch (error) {
    logger.warn({ error, userId, query }, 'Semantic search failed, falling back to keyword');
    
    // Fallback to keyword search
    const results = await keywordSearch(userId, query, limit, offset);
    
    return {
      memories: results.memories,
      method: 'keyword',
      degraded: true,
      query,
      totalCount: results.totalCount
    };
  }
}

async function semanticSearch(
  userId: string,
  queryVector: number[],
  limit: number,
  offset: number
): Promise<{ memories: Memory[]; totalCount: number }> {
  // Use the partition-aware function
  const result = await db.query(
    `WITH similar AS (
       SELECT memory_id, similarity
       FROM search_similar_embeddings($1, $2::vector, $3 + $4)
     )
     SELECT m.*, s.similarity as relevance_score
     FROM memories m
     JOIN similar s ON m.memory_id = s.memory_id
     WHERE m.state NOT IN ('DELETED', 'DRAFT')
     ORDER BY s.similarity DESC
     LIMIT $3 OFFSET $4`,
    [userId, `[${queryVector.join(',')}]`, limit, offset]
  );

  // Get total count (approximate for performance)
  const countResult = await db.query(
    `SELECT COUNT(*) FROM embeddings WHERE user_id = $1`,
    [userId]
  );

  return {
    memories: result.rows,
    totalCount: parseInt(countResult.rows[0].count)
  };
}

async function keywordSearch(
  userId: string,
  query: string,
  limit: number,
  offset: number
): Promise<{ memories: Memory[]; totalCount: number }> {
  // Convert query to tsquery format
  // Split on spaces, filter short words, join with &
  const words = query
    .split(/\s+/)
    .filter(w => w.length > 2)
    .map(w => w.replace(/[^\w]/g, ''))
    .filter(w => w.length > 0);

  if (words.length === 0) {
    return { memories: [], totalCount: 0 };
  }

  const tsQuery = words.join(' & ');

  const result = await db.query(
    `SELECT m.*, 
            ts_rank(text_search_vector, to_tsquery('english', $2)) as relevance_score
     FROM memories m
     WHERE m.user_id = $1
     AND m.state NOT IN ('DELETED', 'DRAFT')
     AND m.text_search_vector @@ to_tsquery('english', $2)
     ORDER BY relevance_score DESC
     LIMIT $3 OFFSET $4`,
    [userId, tsQuery, limit, offset]
  );

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) FROM memories m
     WHERE m.user_id = $1
     AND m.state NOT IN ('DELETED', 'DRAFT')
     AND m.text_search_vector @@ to_tsquery('english', $2)`,
    [userId, tsQuery]
  );

  return {
    memories: result.rows,
    totalCount: parseInt(countResult.rows[0].count)
  };
}
```

### 4.3 Search API Endpoint

```typescript
// routes/search.ts
import { Router } from 'express';
import { searchMemories } from '../services/searchService';
import { usageLimitMiddleware, incrementUsage } from '../middleware/usageLimits';

const router = Router();

router.get('/',
  usageLimitMiddleware('searches'),
  async (req, res) => {
    const { q, limit = '20', offset = '0' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'MISSING_QUERY', message: 'Query parameter q is required' });
    }

    const results = await searchMemories(
      req.userId,
      q,
      Math.min(parseInt(limit as string), 100),
      parseInt(offset as string)
    );

    await incrementUsage(req.userId, 'searches');

    res.json(results);
  }
);

export default router;
```

### 4.4 React Component: Degraded Search Banner

```tsx
// components/DegradedSearchBanner.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DegradedSearchBannerProps {
  visible: boolean;
  onDismiss?: () => void;
}

export function DegradedSearchBanner({ visible, onDismiss }: DegradedSearchBannerProps) {
  if (!visible) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            Search is using keyword matching. Some results may be less relevant than usual.
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-yellow-400 hover:text-yellow-500"
          >
            <span className="sr-only">Dismiss</span>
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
}
```

### 4.5 Search Hook with Degraded State

```tsx
// hooks/useSearch.ts
import { useState, useCallback } from 'react';
import { searchMemories } from '../api/search';
import type { SearchResult } from '../types';

export function useSearch() {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchMemories(query);
      setResults(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
    isDegraded: results?.degraded ?? false
  };
}
```

---

## 5. pgvector Indexing and Partitioning

### 5.1 Partition Strategy

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create partitioned embeddings table
CREATE TABLE embeddings (
  embedding_id UUID NOT NULL DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vector VECTOR(1536) NOT NULL,
  model_version VARCHAR(50) NOT NULL DEFAULT 'text-embedding-ada-002',
  created_at TIMESTAMP DEFAULT NOW(),
  -- Partition key: hash of user_id mod 16
  partition_key INT GENERATED ALWAYS AS (abs(hashtext(user_id::text)) % 16) STORED,
  PRIMARY KEY (embedding_id, partition_key)
) PARTITION BY LIST (partition_key);

-- Create 16 partitions
DO $$
BEGIN
  FOR i IN 0..15 LOOP
    EXECUTE format(
      'CREATE TABLE embeddings_p%s PARTITION OF embeddings FOR VALUES IN (%s)',
      i, i
    );
  END LOOP;
END $$;

-- Create HNSW index on each partition for optimal performance
DO $$
BEGIN
  FOR i IN 0..15 LOOP
    EXECUTE format(
      'CREATE INDEX idx_embeddings_p%s_hnsw ON embeddings_p%s 
       USING hnsw (vector vector_cosine_ops) 
       WITH (m = 16, ef_construction = 64)',
      i, i
    );
    -- Also create a user_id index for partition pruning
    EXECUTE format(
      'CREATE INDEX idx_embeddings_p%s_user ON embeddings_p%s (user_id)',
      i, i
    );
  END LOOP;
END $$;

-- Foreign key constraint (on memory_id)
ALTER TABLE embeddings ADD CONSTRAINT fk_embeddings_memory 
  FOREIGN KEY (memory_id) REFERENCES memories(memory_id) ON DELETE CASCADE;
```

### 5.2 Optimized Similarity Search Function

```sql
-- Partition-aware similarity search function
CREATE OR REPLACE FUNCTION search_similar_embeddings(
  p_user_id UUID,
  p_query_vector VECTOR(1536),
  p_limit INT DEFAULT 20
)
RETURNS TABLE (memory_id UUID, similarity FLOAT) AS $$
DECLARE
  partition_num INT := abs(hashtext(p_user_id::text)) % 16;
BEGIN
  -- Set HNSW search parameter for this query
  -- Higher ef_search = better recall but slower
  PERFORM set_config('hnsw.ef_search', '40', true);
  
  RETURN QUERY
  SELECT e.memory_id, 1 - (e.vector <=> p_query_vector) AS similarity
  FROM embeddings e
  WHERE e.user_id = p_user_id
  AND e.partition_key = partition_num  -- Enables partition pruning
  ORDER BY e.vector <=> p_query_vector
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_similar_embeddings TO app_user;
```

### 5.3 Embedding Service

```typescript
// services/embeddingService.ts
import OpenAI from 'openai';
import { db } from '../db';
import { recordAICost } from './aiCircuitBreaker';
import { AI_COST_CONFIG } from '../config/aiCostConfig';

const openai = new OpenAI();

export async function generateAndStoreEmbedding(
  memoryId: string,
  userId: string,
  text: string
): Promise<void> {
  // Generate embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.slice(0, 8000), // Limit to ~8K chars
  });

  const embedding = response.data[0].embedding;
  const tokensUsed = response.usage.total_tokens;

  // Store embedding (partition key is auto-generated)
  await db.query(
    `INSERT INTO embeddings (memory_id, user_id, vector, model_version)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (memory_id) DO UPDATE SET vector = $3, created_at = NOW()`,
    [memoryId, userId, `[${embedding.join(',')}]`, 'text-embedding-ada-002']
  );

  // Record cost
  await recordAICost(
    userId,
    'embedding',
    tokensUsed,
    AI_COST_CONFIG.costs.embedding,
    'text-embedding-ada-002',
    memoryId
  );
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query.slice(0, 1000), // Limit query length
  });

  return response.data[0].embedding;
}

export async function deleteEmbedding(memoryId: string): Promise<void> {
  await db.query('DELETE FROM embeddings WHERE memory_id = $1', [memoryId]);
}
```

### 5.4 Load Test Checklist

```typescript
// tests/loadTest.ts
import { db } from '../db';

interface LoadTestResult {
  scenario: string;
  target: string;
  actual: string;
  passed: boolean;
}

export async function runPgvectorLoadTests(): Promise<LoadTestResult[]> {
  const results: LoadTestResult[] = [];

  // Test 1: Search latency with 1000 embeddings
  const test1 = await testSearchLatency(1000);
  results.push({
    scenario: 'Search latency with 1000 embeddings/user',
    target: '< 50ms P95',
    actual: `${test1.p95}ms P95`,
    passed: test1.p95 < 50
  });

  // Test 2: Search latency with 5000 embeddings
  const test2 = await testSearchLatency(5000);
  results.push({
    scenario: 'Search latency with 5000 embeddings/user',
    target: '< 100ms P95',
    actual: `${test2.p95}ms P95`,
    passed: test2.p95 < 100
  });

  // Test 3: Index memory usage
  const test3 = await testIndexMemory();
  results.push({
    scenario: 'Index memory usage (16 partitions)',
    target: '< 4GB at 10M vectors',
    actual: `${test3.sizeGB}GB`,
    passed: test3.sizeGB < 4
  });

  // Test 4: Insert throughput
  const test4 = await testInsertThroughput();
  results.push({
    scenario: 'Insert throughput',
    target: '> 500 inserts/sec',
    actual: `${test4.insertsPerSec} inserts/sec`,
    passed: test4.insertsPerSec > 500
  });

  return results;
}

async function testSearchLatency(vectorCount: number): Promise<{ p95: number }> {
  // Implementation would create test data and measure latencies
  // Placeholder for actual implementation
  return { p95: 0 };
}

async function testIndexMemory(): Promise<{ sizeGB: number }> {
  const result = await db.query(`
    SELECT pg_size_pretty(pg_total_relation_size('embeddings')) as size,
           pg_total_relation_size('embeddings') as bytes
  `);
  return { sizeGB: result.rows[0].bytes / (1024 * 1024 * 1024) };
}

async function testInsertThroughput(): Promise<{ insertsPerSec: number }> {
  // Implementation would measure insert performance
  return { insertsPerSec: 0 };
}
```

---

## 6. In-App Reminder Inbox

### 6.1 Schema Updates

```sql
-- Add inbox-related columns to reminders
ALTER TABLE reminders ADD COLUMN read_at TIMESTAMP;
ALTER TABLE reminders ADD COLUMN dismissed_at TIMESTAMP;

-- Index for efficient inbox queries
CREATE INDEX idx_reminders_inbox ON reminders(user_id, status, read_at)
  WHERE status = 'sent' AND dismissed_at IS NULL;

-- Index for unread count
CREATE INDEX idx_reminders_unread ON reminders(user_id)
  WHERE status = 'sent' AND read_at IS NULL AND dismissed_at IS NULL;
```

### 6.2 Reminder Inbox API

```typescript
// routes/reminders.ts
import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Get inbox
router.get('/inbox', async (req, res) => {
  const userId = req.userId;

  // Get unread count
  const countResult = await db.query(
    `SELECT COUNT(*) as unread_count
     FROM reminders
     WHERE user_id = $1 AND status = 'sent' AND read_at IS NULL AND dismissed_at IS NULL`,
    [userId]
  );

  // Get recent reminders (last 30 days)
  const remindersResult = await db.query(
    `SELECT r.reminder_id, r.memory_id, r.scheduled_at, r.sent_at, r.read_at,
            m.text_content, m.type, m.image_url
     FROM reminders r
     JOIN memories m ON r.memory_id = m.memory_id
     WHERE r.user_id = $1 
     AND r.status = 'sent' 
     AND r.dismissed_at IS NULL
     AND r.scheduled_at > NOW() - INTERVAL '30 days'
     ORDER BY r.scheduled_at DESC
     LIMIT 50`,
    [userId]
  );

  const reminders = remindersResult.rows.map(r => ({
    reminder_id: r.reminder_id,
    memory_id: r.memory_id,
    memory_preview: truncateText(r.text_content, 60),
    memory_type: r.type,
    has_image: !!r.image_url,
    scheduled_at: r.scheduled_at,
    sent_at: r.sent_at,
    read_at: r.read_at
  }));

  res.json({
    unread_count: parseInt(countResult.rows[0].unread_count),
    reminders
  });
});

// Mark as read
router.post('/:id/read', async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const result = await db.query(
    `UPDATE reminders 
     SET read_at = NOW() 
     WHERE reminder_id = $1 AND user_id = $2 AND read_at IS NULL
     RETURNING reminder_id`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }

  res.json({ success: true });
});

// Dismiss from inbox
router.post('/:id/dismiss', async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const result = await db.query(
    `UPDATE reminders 
     SET dismissed_at = NOW() 
     WHERE reminder_id = $1 AND user_id = $2 AND dismissed_at IS NULL
     RETURNING reminder_id`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }

  res.json({ success: true });
});

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export default router;
```

### 6.3 React Components

```tsx
// components/ReminderInbox.tsx
import React, { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useReminders } from '../hooks/useReminders';

export function ReminderInboxButton() {
  const { unreadCount } = useReminders();

  return (
    <button className="relative p-2 text-gray-600 hover:text-gray-900">
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export function ReminderInbox() {
  const { reminders, unreadCount, loading, markAsRead, dismiss } = useReminders();

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  if (reminders.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No reminders yet.</p>
        <p className="text-sm mt-2">We'll remind you to revisit your memories over time.</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {reminders.map(reminder => (
        <ReminderCard
          key={reminder.reminder_id}
          reminder={reminder}
          onRead={() => markAsRead(reminder.reminder_id)}
          onDismiss={() => dismiss(reminder.reminder_id)}
        />
      ))}
    </div>
  );
}

interface ReminderCardProps {
  reminder: Reminder;
  onRead: () => void;
  onDismiss: () => void;
}

function ReminderCard({ reminder, onRead, onDismiss }: ReminderCardProps) {
  const isUnread = !reminder.read_at;

  return (
    <div 
      className={`p-4 flex items-start gap-3 ${isUnread ? 'bg-blue-50' : 'bg-white'}`}
      onClick={onRead}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeBadgeClass(reminder.memory_type)}`}>
            {reminder.memory_type}
          </span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(reminder.scheduled_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-gray-900 truncate">{reminder.memory_preview}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="p-1 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function getTypeBadgeClass(type: string): string {
  const classes: Record<string, string> = {
    person: 'bg-purple-100 text-purple-700',
    event: 'bg-blue-100 text-blue-700',
    place: 'bg-green-100 text-green-700',
    task: 'bg-orange-100 text-orange-700',
    note: 'bg-gray-100 text-gray-700'
  };
  return classes[type] || classes.note;
}
```

### 6.4 Reminders Hook

```tsx
// hooks/useReminders.ts
import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/reminders';

interface Reminder {
  reminder_id: string;
  memory_id: string;
  memory_preview: string;
  memory_type: string;
  scheduled_at: string;
  sent_at: string;
  read_at: string | null;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    try {
      const data = await api.getInbox();
      setReminders(data.reminders);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to fetch reminders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    // Poll every 60 seconds for new reminders
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  const markAsRead = useCallback(async (reminderId: string) => {
    await api.markAsRead(reminderId);
    setReminders(prev => prev.map(r => 
      r.reminder_id === reminderId ? { ...r, read_at: new Date().toISOString() } : r
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const dismiss = useCallback(async (reminderId: string) => {
    await api.dismiss(reminderId);
    setReminders(prev => prev.filter(r => r.reminder_id !== reminderId));
    const wasUnread = reminders.find(r => r.reminder_id === reminderId)?.read_at === null;
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [reminders]);

  return {
    reminders,
    unreadCount,
    loading,
    markAsRead,
    dismiss,
    refresh: fetchReminders
  };
}
```

---

## 7. Offline Conflict UI Copy

### 7.1 Sync Status Messages

```typescript
// constants/syncMessages.ts
export const SYNC_MESSAGES = {
  // Success states
  sync_complete: {
    type: 'success',
    message: (count: number) => `✓ ${count} ${count === 1 ? 'memory' : 'memories'} synced`,
    autoDismiss: 3000
  },

  back_online: {
    type: 'success',
    message: (count: number) => `You're back online! ${count} ${count === 1 ? 'memory' : 'memories'} synced.`,
    autoDismiss: 5000
  },

  // Warning states
  offline_queued: {
    type: 'warning',
    message: 'Saved offline. Will sync when connected.',
    autoDismiss: false,
    persistent: true
  },

  // Conflict states
  multi_device_conflict: {
    type: 'info',
    message: 'This memory was updated on another device. Your version was kept.',
    action: 'View Both',
    autoDismiss: false
  },

  // Error states
  queue_expired: {
    type: 'error',
    message: "A memory couldn't be saved after 24 hours offline. Tap to retry.",
    actions: ['Retry', 'Discard'],
    autoDismiss: false
  },

  server_rejected: {
    type: 'error',
    message: (reason: string) => `Couldn't save memory: ${reason}. Please try again.`,
    actions: ['Edit', 'Discard'],
    autoDismiss: false
  },

  queue_overflow: {
    type: 'error',
    message: 'Too many pending saves. Please connect to sync.',
    autoDismiss: false
  }
};
```

### 7.2 Toast Component

```tsx
// components/SyncToast.tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'warning' | 'error' | 'info';

interface SyncToastProps {
  type: ToastType;
  message: string;
  actions?: { label: string; onClick: () => void }[];
  autoDismiss?: number | false;
  onDismiss: () => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />
};

const BG_COLORS: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200'
};

export function SyncToast({ type, message, actions, autoDismiss, onDismiss }: SyncToastProps) {
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 
                     border rounded-lg shadow-lg p-4 ${BG_COLORS[type]}`}>
      <div className="flex items-start gap-3">
        {ICONS[type]}
        <div className="flex-1">
          <p className="text-sm text-gray-900">{message}</p>
          {actions && actions.length > 0 && (
            <div className="mt-2 flex gap-2">
              {actions.map(action => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

### 7.3 Conflict Resolution Modal

```tsx
// components/ConflictResolutionModal.tsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface MemoryVersion {
  text_content: string;
  updated_at: string;
  source: 'local' | 'server';
  device?: string;
}

interface ConflictResolutionModalProps {
  localVersion: MemoryVersion;
  serverVersion: MemoryVersion;
  onKeepLocal: () => void;
  onUseServer: () => void;
  onMerge: () => void;
  onClose: () => void;
}

export function ConflictResolutionModal({
  localVersion,
  serverVersion,
  onKeepLocal,
  onUseServer,
  onMerge,
  onClose
}: ConflictResolutionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Memory Updated Elsewhere</h2>
          <p className="text-sm text-gray-500 mt-1">
            This memory was edited on another device while you were offline. We kept your version.
          </p>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {/* Your version */}
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Your version (kept)</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(localVersion.updated_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{localVersion.text_content}</p>
          </div>

          {/* Server version */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                From {serverVersion.device || 'another device'}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(serverVersion.updated_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{serverVersion.text_content}</p>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onKeepLocal}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700"
          >
            Keep Mine
          </button>
          <button
            onClick={onUseServer}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200"
          >
            Use Other
          </button>
          <button
            onClick={onMerge}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
          >
            Merge
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. Operational Runbooks

### 8.1 RB-001: AI Cost Spike

**Trigger**: Slack alert - AI spend at 80% or 100% of daily budget

```markdown
## Immediate Actions (< 5 minutes)

1. **Check admin dashboard**: https://admin.memoryconnector.com/ai-costs
   - Current spend vs budget
   - Circuit breaker status
   - Top users by usage

2. **Assess the cause**:
   - Normal traffic growth?
   - Single user abuse?
   - Bug causing repeated API calls?

## If Abuse Detected

3. **Rate-limit the user**:
   ```bash
   curl -X POST https://api.memoryconnector.com/admin/users/{userId}/rate-limit \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"ai_calls_per_day": 10}'
   ```

4. **Review user activity**:
   ```sql
   SELECT operation, COUNT(*), SUM(cost_cents)
   FROM ai_cost_tracking
   WHERE user_id = '{userId}' AND date = CURRENT_DATE
   GROUP BY operation;
   ```

## If Legitimate Traffic

5. **Consider options**:
   - Accept queue mode until midnight
   - Temporarily increase daily budget (requires manager approval)
   - Enable local classification fallback

6. **Increase budget if approved**:
   ```bash
   redis-cli SET ai:daily:budget 15000  # $150
   ```

## Post-Incident

7. **Create incident report** with:
   - Root cause
   - Impact (memories in queue, user experience)
   - Prevention measures

8. **Review budget allocation**:
   - Adjust perUserDailyClassifications if too generous
   - Consider pricing tier changes
```

### 8.2 RB-002: Queue Backlog

**Trigger**: Slack alert - Queue depth > 5000 messages

```markdown
## Immediate Actions (< 5 minutes)

1. **Check SQS metrics**:
   ```bash
   aws sqs get-queue-attributes \
     --queue-url $ENRICHMENT_QUEUE_URL \
     --attribute-names ApproximateNumberOfMessages,ApproximateAgeOfOldestMessage
   ```

2. **Check consumer health**:
   ```bash
   aws ecs describe-services \
     --cluster memory-connector \
     --services enrichment-worker
   ```

## If Workers Down

3. **Force new deployment**:
   ```bash
   aws ecs update-service \
     --cluster memory-connector \
     --service enrichment-worker \
     --force-new-deployment
   ```

4. **Check logs for errors**:
   ```bash
   aws logs tail /ecs/enrichment-worker --since 30m
   ```

## If Workers Slow

5. **Check downstream dependencies**:
   - OpenAI API status: https://status.openai.com
   - Database connections: Check RDS metrics
   - Redis connectivity

6. **Scale workers if needed**:
   ```bash
   aws ecs update-service \
     --cluster memory-connector \
     --service enrichment-worker \
     --desired-count 10  # Default is 5
   ```

## Monitoring Recovery

7. **Watch drain rate**:
   ```bash
   watch -n 30 'aws sqs get-queue-attributes \
     --queue-url $ENRICHMENT_QUEUE_URL \
     --attribute-names ApproximateNumberOfMessages'
   ```

8. **Expected recovery**: Queue should drain within 30 minutes of fix
```

### 8.3 RB-003: pgvector Performance Regression

**Trigger**: Search P95 latency > 500ms for 10+ minutes

```markdown
## Immediate Actions (< 5 minutes)

1. **Check database metrics in CloudWatch/RDS Console**:
   - CPU utilization
   - Free memory
   - Database connections
   - IOPS

2. **Check for long-running queries**:
   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
   AND state != 'idle';
   ```

## Diagnostics

3. **Check index health**:
   ```sql
   SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read
   FROM pg_stat_user_indexes
   WHERE relname LIKE 'embeddings%'
   ORDER BY idx_scan DESC;
   ```

4. **Check for bloat**:
   ```sql
   SELECT relname, n_dead_tup, n_live_tup, 
          round(n_dead_tup * 100.0 / nullif(n_live_tup, 0), 2) as dead_pct
   FROM pg_stat_user_tables
   WHERE relname LIKE 'embeddings%';
   ```

5. **Run VACUUM if needed**:
   ```sql
   VACUUM ANALYZE embeddings;
   ```

## If Index Not Being Used

6. **Check query plan**:
   ```sql
   EXPLAIN ANALYZE SELECT memory_id, 1 - (vector <=> '[...]') as similarity
   FROM embeddings WHERE user_id = '...'
   ORDER BY vector <=> '[...]' LIMIT 20;
   ```

7. **Verify HNSW settings**:
   ```sql
   SHOW hnsw.ef_search;  -- Should be 40
   ```

8. **Reindex if needed** (causes brief lock):
   ```sql
   REINDEX INDEX CONCURRENTLY idx_embeddings_p0_hnsw;
   ```

## Enable Fallback

9. **Force keyword search via feature flag**:
   ```bash
   curl -X POST https://api.launchdarkly.com/flags/search_fallback \
     -d '{"value": true}'
   ```

## Escalation

10. **If not resolved in 30 minutes**: Page database on-call
```

---

## 9. IndexedDB Device Testing

### 9.1 Test Devices Matrix

| Device | OS | Storage Quota | Priority |
|--------|-----|---------------|----------|
| iPhone SE (2020) | iOS 16.x | ~50MB default | High |
| iPhone 8 | iOS 15.x | ~50MB default | High |
| Samsung Galaxy A12 | Android 11 | Varies by storage | High |
| Pixel 4a | Android 13 | Up to 60% free space | Medium |
| iPad Mini (5th gen) | iPadOS 16 | ~50MB default | Medium |

### 9.2 Test Scenarios Checklist

```markdown
## Draft Persistence
- [ ] Create draft with 500 chars
- [ ] Force-kill app (not just background)
- [ ] Reopen app
- [ ] Verify "Continue editing draft?" prompt appears
- [ ] Verify draft content is intact

## Queue 50 Memories Offline
- [ ] Enable airplane mode
- [ ] Save 50 memories consecutively
- [ ] Verify all show yellow "offline" badge
- [ ] Disable airplane mode
- [ ] Verify all 50 sync successfully
- [ ] Verify green "synced" toast appears

## Queue Overflow (51st Memory)
- [ ] Enable airplane mode
- [ ] Save 50 memories
- [ ] Attempt to save 51st
- [ ] Verify error message: "Too many pending saves..."
- [ ] Verify app doesn't crash

## Storage Quota Exceeded
- [ ] Fill device storage to near capacity
- [ ] Attempt to save new memory
- [ ] Verify graceful error message
- [ ] Verify suggestion to clear cache

## Cache Eviction by OS
- [ ] Save 50 memories online
- [ ] Use other apps to pressure memory
- [ ] Return to app
- [ ] Verify app handles missing cache gracefully
- [ ] Verify data re-fetches from server

## 24-Hour Queue Expiry
- [ ] Enable airplane mode
- [ ] Save memory
- [ ] Set device clock forward 25 hours (or use test flag)
- [ ] Verify memory moves to draft state
- [ ] Verify user notification appears

## Low Storage Device (<500MB free)
- [ ] Simulate low storage on device
- [ ] Verify app launches
- [ ] Verify reduced offline capacity messaging
- [ ] Verify core functions work
```

### 9.3 Storage Quota Detection

```typescript
// utils/storageQuota.ts
export interface StorageStatus {
  availableBytes: number;
  usedBytes: number;
  canStoreMore: boolean;
  warningThreshold: boolean;
  quotaType: 'estimated' | 'persistent' | 'unknown';
}

export async function checkStorageQuota(): Promise<StorageStatus> {
  // Modern Storage API
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const { quota, usage } = await navigator.storage.estimate();
      const available = (quota || 0) - (usage || 0);
      
      return {
        availableBytes: available,
        usedBytes: usage || 0,
        canStoreMore: available > 1024 * 1024, // 1MB minimum
        warningThreshold: available < 5 * 1024 * 1024, // <5MB warning
        quotaType: 'estimated'
      };
    } catch (e) {
      console.warn('Storage estimate failed', e);
    }
  }

  // Fallback: assume 50MB available (iOS Safari default)
  return {
    availableBytes: 50 * 1024 * 1024,
    usedBytes: 0,
    canStoreMore: true,
    warningThreshold: false,
    quotaType: 'unknown'
  };
}

export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    try {
      return await navigator.storage.persist();
    } catch (e) {
      console.warn('Persistent storage request failed', e);
    }
  }
  return false;
}

// Hook for React components
export function useStorageStatus() {
  const [status, setStatus] = useState<StorageStatus | null>(null);

  useEffect(() => {
    checkStorageQuota().then(setStatus);
    
    // Re-check periodically
    const interval = setInterval(() => {
      checkStorageQuota().then(setStatus);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
```

### 9.4 Queue Management

```typescript
// services/offlineQueue.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MemoryQueueItem {
  id: string;
  idempotencyKey: string;
  memory: {
    text_content?: string;
    image_url?: string;
  };
  queuedAt: number;
  retryCount: number;
  lastRetryAt?: number;
}

interface OfflineDB extends DBSchema {
  'pending-memories': {
    key: string;
    value: MemoryQueueItem;
    indexes: { 'by-queued': number };
  };
  'drafts': {
    key: string;
    value: {
      id: string;
      text: string;
      imageUrl?: string;
      updatedAt: number;
    };
  };
}

const MAX_QUEUE_SIZE = 50;
const QUEUE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let db: IDBPDatabase<OfflineDB>;

async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (!db) {
    db = await openDB<OfflineDB>('memory-connector', 1, {
      upgrade(db) {
        const pendingStore = db.createObjectStore('pending-memories', { keyPath: 'id' });
        pendingStore.createIndex('by-queued', 'queuedAt');
        db.createObjectStore('drafts', { keyPath: 'id' });
      }
    });
  }
  return db;
}

export async function queueMemory(item: Omit<MemoryQueueItem, 'queuedAt' | 'retryCount'>): Promise<{
  success: boolean;
  error?: string;
}> {
  const database = await getDB();
  
  // Check queue size
  const count = await database.count('pending-memories');
  if (count >= MAX_QUEUE_SIZE) {
    return { success: false, error: 'QUEUE_FULL' };
  }

  // Check storage quota
  const storage = await checkStorageQuota();
  if (!storage.canStoreMore) {
    return { success: false, error: 'STORAGE_FULL' };
  }

  await database.put('pending-memories', {
    ...item,
    queuedAt: Date.now(),
    retryCount: 0
  });

  return { success: true };
}

export async function getQueuedMemories(): Promise<MemoryQueueItem[]> {
  const database = await getDB();
  return database.getAllFromIndex('pending-memories', 'by-queued');
}

export async function removeFromQueue(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('pending-memories', id);
}

export async function processExpiredItems(): Promise<string[]> {
  const database = await getDB();
  const items = await database.getAll('pending-memories');
  const now = Date.now();
  const expiredIds: string[] = [];

  for (const item of items) {
    if (now - item.queuedAt > QUEUE_TTL_MS) {
      // Move to drafts
      await database.put('drafts', {
        id: item.id,
        text: item.memory.text_content || '',
        imageUrl: item.memory.image_url,
        updatedAt: now
      });
      await database.delete('pending-memories', item.id);
      expiredIds.push(item.id);
    }
  }

  return expiredIds;
}

export async function getQueueSize(): Promise<number> {
  const database = await getDB();
  return database.count('pending-memories');
}
```

---

## 10. Near-Duplicate Detection Soft Launch

### 10.1 Feature Flag Configuration

```typescript
// config/featureFlags.ts
export interface NearDuplicateConfig {
  enabled: boolean;
  logOnly: boolean;           // Log detections but don't show UI
  showUI: boolean;            // Show 'Did you mean?' prompts
  similarityThreshold: number; // General similarity threshold
  personThreshold: number;     // Higher threshold for Person type
  duplicateThreshold: number;  // Near-exact duplicate threshold
  rolloutPercentage: number;   // % of users to enable
  minTextLength: number;       // Minimum chars to trigger check
  debounceMs: number;          // Wait time after typing stops
}

export const NEAR_DUPLICATE_DEFAULTS: NearDuplicateConfig = {
  enabled: true,
  logOnly: true,           // Start with logging only
  showUI: false,           // UI disabled initially
  similarityThreshold: 0.85,
  personThreshold: 0.90,
  duplicateThreshold: 0.95,
  rolloutPercentage: 10,   // Start with 10%
  minTextLength: 50,
  debounceMs: 3000
};

// LaunchDarkly or similar integration
export async function getNearDuplicateConfig(userId: string): Promise<NearDuplicateConfig> {
  // Check if user is in rollout
  const userHash = hashUserId(userId);
  const inRollout = (userHash % 100) < NEAR_DUPLICATE_DEFAULTS.rolloutPercentage;

  if (!inRollout) {
    return { ...NEAR_DUPLICATE_DEFAULTS, enabled: false };
  }

  // Fetch config from feature flag service
  // This allows real-time threshold tuning
  return fetchFeatureFlag('near_duplicate_detection', NEAR_DUPLICATE_DEFAULTS);
}
```

### 10.2 Detection Service

```typescript
// services/nearDuplicateService.ts
import { generateQueryEmbedding } from './embeddingService';
import { db } from '../db';
import { logger } from '../utils/logger';
import { trackEvent } from './analytics';

export interface DuplicateCheckResult {
  hasSimilar: boolean;
  matches: {
    memoryId: string;
    similarity: number;
    type: string;
    preview: string;
    matchType: 'duplicate' | 'related' | 'person';
  }[];
  checkDurationMs: number;
}

export async function checkForNearDuplicates(
  userId: string,
  text: string,
  config: NearDuplicateConfig
): Promise<DuplicateCheckResult> {
  const startTime = Date.now();

  // Skip if text too short
  if (text.length < config.minTextLength) {
    return { hasSimilar: false, matches: [], checkDurationMs: 0 };
  }

  try {
    // Generate embedding for draft text
    const embedding = await generateQueryEmbedding(text);

    // Search for similar memories
    const result = await db.query(
      `SELECT m.memory_id, m.type, m.text_content,
              1 - (e.vector <=> $2::vector) as similarity
       FROM embeddings e
       JOIN memories m ON e.memory_id = m.memory_id
       WHERE e.user_id = $1
       AND m.state NOT IN ('DELETED', 'DRAFT')
       ORDER BY e.vector <=> $2::vector
       LIMIT 5`,
      [userId, `[${embedding.join(',')}]`]
    );

    const matches = result.rows
      .filter(row => row.similarity >= config.similarityThreshold)
      .map(row => ({
        memoryId: row.memory_id,
        similarity: row.similarity,
        type: row.type,
        preview: truncateText(row.text_content, 60),
        matchType: determineMatchType(row.similarity, row.type, config)
      }));

    const checkDurationMs = Date.now() - startTime;

    // Log for analytics (always, regardless of UI)
    if (matches.length > 0) {
      logger.info({
        userId,
        matchCount: matches.length,
        topSimilarity: matches[0].similarity,
        topType: matches[0].type,
        checkDurationMs
      }, 'Near-duplicate detected');

      trackEvent('near_duplicate_detected', {
        userId,
        matchCount: matches.length,
        topSimilarity: matches[0].similarity,
        showUI: config.showUI
      });
    }

    return {
      hasSimilar: matches.length > 0,
      matches,
      checkDurationMs
    };
  } catch (error) {
    logger.error({ error, userId }, 'Near-duplicate check failed');
    return { hasSimilar: false, matches: [], checkDurationMs: Date.now() - startTime };
  }
}

function determineMatchType(
  similarity: number,
  type: string,
  config: NearDuplicateConfig
): 'duplicate' | 'related' | 'person' {
  if (similarity >= config.duplicateThreshold) {
    return 'duplicate';
  }
  if (type === 'person' && similarity >= config.personThreshold) {
    return 'person';
  }
  return 'related';
}

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
```

### 10.3 Analytics Tracking

```typescript
// services/analytics.ts
interface NearDuplicateEvent {
  event: string;
  userId: string;
  properties: {
    matchCount?: number;
    topSimilarity?: number;
    showUI?: boolean;
    action?: 'add' | 'create_new' | 'dismiss';
    matchType?: string;
    detectionLatencyMs?: number;
  };
}

const NEAR_DUPLICATE_EVENTS = {
  DETECTED: 'near_duplicate_detected',
  PROMPT_SHOWN: 'near_duplicate_prompt_shown',
  ADD_CLICKED: 'near_duplicate_add_clicked',
  CREATE_NEW_CLICKED: 'near_duplicate_create_new_clicked',
  DISMISSED: 'near_duplicate_dismissed',
  FEATURE_DISABLED: 'near_duplicate_feature_disabled'
};

export function trackNearDuplicateEvent(
  event: keyof typeof NEAR_DUPLICATE_EVENTS,
  userId: string,
  properties: NearDuplicateEvent['properties']
): void {
  trackEvent(NEAR_DUPLICATE_EVENTS[event], {
    userId,
    ...properties,
    timestamp: new Date().toISOString()
  });
}
```

### 10.4 React Hook for Near-Duplicate Detection

```tsx
// hooks/useNearDuplicateDetection.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { checkForNearDuplicates, DuplicateCheckResult } from '../services/nearDuplicateService';
import { getNearDuplicateConfig } from '../config/featureFlags';
import { trackNearDuplicateEvent } from '../services/analytics';

export function useNearDuplicateDetection(userId: string) {
  const [result, setResult] = useState<DuplicateCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<NearDuplicateConfig | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastTextRef = useRef<string>('');

  // Load config on mount
  useEffect(() => {
    getNearDuplicateConfig(userId).then(setConfig);
  }, [userId]);

  const checkText = useCallback(async (text: string) => {
    if (!config?.enabled) return;
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Skip if text too short or unchanged
    if (text.length < config.minTextLength || text === lastTextRef.current) {
      return;
    }

    // Debounce the check
    debounceRef.current = setTimeout(async () => {
      lastTextRef.current = text;
      setLoading(true);

      try {
        const checkResult = await checkForNearDuplicates(userId, text, config);
        setResult(checkResult);

        if (checkResult.hasSimilar && config.showUI) {
          trackNearDuplicateEvent('PROMPT_SHOWN', userId, {
            matchCount: checkResult.matches.length,
            topSimilarity: checkResult.matches[0].similarity,
            matchType: checkResult.matches[0].matchType
          });
        }
      } finally {
        setLoading(false);
      }
    }, config.debounceMs);
  }, [config, userId]);

  const handleAddToExisting = useCallback((memoryId: string) => {
    trackNearDuplicateEvent('ADD_CLICKED', userId, {
      action: 'add'
    });
    // Navigate to memory or trigger append
    setResult(null);
  }, [userId]);

  const handleCreateNew = useCallback(() => {
    trackNearDuplicateEvent('CREATE_NEW_CLICKED', userId, {
      action: 'create_new'
    });
    setResult(null);
  }, [userId]);

  const handleDismiss = useCallback(() => {
    trackNearDuplicateEvent('DISMISSED', userId, {
      action: 'dismiss'
    });
    setResult(null);
  }, [userId]);

  return {
    result,
    loading,
    enabled: config?.enabled && config?.showUI,
    checkText,
    handleAddToExisting,
    handleCreateNew,
    handleDismiss
  };
}
```

### 10.5 Rollout Plan

```markdown
## Week 1: Logging Only (100% of users)
- Deploy with `logOnly: true`, `showUI: false`
- Collect baseline metrics:
  - Detection rate (% of saves with matches)
  - Similarity distribution
  - Detection latency
- Target: < 2s P95 latency, < 30% detection rate

## Week 2: 10% UI Rollout
- Enable `showUI: true` for 10% of users
- Monitor:
  - Acceptance rate (clicks "Add to memory")
  - Dismiss rate
  - False positive signals (create new after seeing prompt)
- Alert if dismiss rate > 70%

## Week 3: Threshold Tuning
- Analyze Week 2 data
- Adjust thresholds if needed:
  - If too many false positives: raise `similarityThreshold`
  - If missing obvious duplicates: lower `duplicateThreshold`
- Expand to 25% if metrics healthy

## Week 4: 50% Rollout
- Requires:
  - Acceptance rate > 20%
  - Dismiss rate < 60%
  - No significant increase in support tickets
- Add settings toggle for users to disable

## Week 5+: Full Rollout
- Enable for 100% of users
- Continue monitoring for drift
- Consider A/B testing threshold variations
```

### 10.6 Kill Switch Procedure

```typescript
// Kill switch for near-duplicate detection
export async function disableNearDuplicateUI(): Promise<void> {
  // Update feature flag to disable UI immediately
  await updateFeatureFlag('near_duplicate_detection', {
    showUI: false,
    logOnly: true // Keep logging for analysis
  });

  // Log the action
  logger.warn('Near-duplicate UI disabled via kill switch');

  // Alert the team
  await alertSlack({
    channel: '#product-alerts',
    severity: 'warning',
    message: 'Near-duplicate detection UI disabled. Logging continues.'
  });
}
```

---

## Project Structure

```
memory-connector/
├── src/
│   ├── config/
│   │   ├── aiCostConfig.ts
│   │   └── featureFlags.ts
│   ├── middleware/
│   │   ├── idempotency.ts
│   │   └── usageLimits.ts
│   ├── services/
│   │   ├── aiCircuitBreaker.ts
│   │   ├── alerting.ts
│   │   ├── duplicateDetection.ts
│   │   ├── embeddingService.ts
│   │   ├── enrichmentQueue.ts
│   │   ├── nearDuplicateService.ts
│   │   ├── offlineQueue.ts (client)
│   │   └── searchService.ts
│   ├── routes/
│   │   ├── memories.ts
│   │   ├── reminders.ts
│   │   └── search.ts
│   ├── hooks/ (client)
│   │   ├── useNearDuplicateDetection.ts
│   │   ├── useReminders.ts
│   │   ├── useSearch.ts
│   │   └── useStorageStatus.ts
│   ├── components/ (client)
│   │   ├── ConflictResolutionModal.tsx
│   │   ├── DegradedSearchBanner.tsx
│   │   ├── LimitWarningModal.tsx
│   │   ├── ReminderInbox.tsx
│   │   └── SyncToast.tsx
│   └── constants/
│       ├── limitMessages.ts
│       └── syncMessages.ts
├── migrations/
│   ├── 001_user_usage.sql
│   ├── 002_ai_cost_tracking.sql
│   ├── 003_idempotency_keys.sql
│   ├── 004_full_text_search.sql
│   ├── 005_embeddings_partitions.sql
│   └── 006_reminder_inbox.sql
├── runbooks/
│   ├── RB-001-ai-cost-spike.md
│   ├── RB-002-queue-backlog.md
│   └── RB-003-pgvector-regression.md
└── tests/
    ├── load/
    │   └── pgvector-load-test.ts
    └── device/
        └── indexeddb-checklist.md
```

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run migrations
npm run migrate

# Start development server
npm run dev

# Run load tests
npm run test:load

# Check feature flags
npm run flags:check
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/memory_connector
REDIS_URL=redis://localhost:6379

# AWS
AWS_REGION=us-east-1
ENRICHMENT_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/xxx/enrichment

# OpenAI
OPENAI_API_KEY=sk-...

# Slack Alerts
SLACK_BOT_TOKEN=xoxb-...

# Feature Flags
LAUNCHDARKLY_SDK_KEY=sdk-...
```
