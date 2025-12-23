import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { AI_COST_CONFIG } from '../config/ai-cost.config';
import { logger } from '../common/logger';
import { AlertingService } from '../alerting/alerting.service';

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Blocked - budget exceeded
  QUEUE_ONLY = 'queue', // Accepting but queueing for later
}

@Injectable()
export class CircuitBreakerService {
  private readonly CIRCUIT_KEY = 'ai:circuit:status';
  private readonly SPEND_KEY = 'ai:daily:spend';

  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private prisma: PrismaService,
    private alerting: AlertingService,
    private config: ConfigService
  ) {}

  async getCircuitState(): Promise<CircuitState> {
    const state = await this.redis.get(this.CIRCUIT_KEY);
    return (state as CircuitState) || CircuitState.CLOSED;
  }

  async setCircuitState(state: CircuitState, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(this.CIRCUIT_KEY, state, 'EX', ttlSeconds);
    } else {
      await this.redis.set(this.CIRCUIT_KEY, state);
    }
    logger.info({ state }, 'Circuit breaker state changed');
  }

  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  private getMidnightTimestamp(): number {
    const midnight = new Date();
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    return Math.floor(midnight.getTime() / 1000);
  }

  async recordAICost(
    userId: string,
    operation: 'embedding' | 'classification' | 'search_query',
    tokens: number,
    costCents: number,
    model: string,
    memoryId?: string
  ): Promise<void> {
    // Record to database
    await this.prisma.aiCostTracking.create({
      data: {
        userId,
        operation,
        tokensUsed: tokens,
        costCents: costCents.toString(),
        model,
        memoryId: memoryId || null,
        date: new Date(),
      },
    });

    // Update Redis counter (expires at midnight)
    const newTotalStr = await this.redis.incrbyfloat(this.SPEND_KEY, costCents);
    const newTotal = parseFloat(newTotalStr);
    await this.redis.expireat(this.SPEND_KEY, this.getMidnightTimestamp());

    // Check thresholds
    const percentUsed = (newTotal / AI_COST_CONFIG.globalDailyBudgetCents) * 100;
    const today = new Date().toISOString().split('T')[0];

    for (const threshold of AI_COST_CONFIG.alertThresholds) {
      const alertKey = `ai:alert:${threshold}:${today}`;
      const alreadyAlerted = await this.redis.exists(alertKey);

      if (percentUsed >= threshold && !alreadyAlerted) {
        await this.redis.set(alertKey, '1', 'EX', 86400);

        await this.alerting.alertSlack({
          channel: this.config.get<string>('SLACK_CHANNEL_AI_COSTS', '#ai-costs'),
          severity: threshold >= 100 ? 'critical' : 'warning',
          message: `AI spend at ${threshold}% of daily budget ($${(newTotal / 100).toFixed(2)}/$${(AI_COST_CONFIG.globalDailyBudgetCents / 100).toFixed(2)})`,
        });

        // Trip circuit breaker at 100%
        if (threshold >= 100 && AI_COST_CONFIG.circuitBreakerEnabled) {
          await this.setCircuitState(CircuitState.OPEN, this.getSecondsUntilMidnight());

          await this.alerting.alertSlack({
            channel: this.config.get<string>('SLACK_CHANNEL_AI_COSTS', '#ai-costs'),
            severity: 'critical',
            message: '🚨 AI CIRCUIT BREAKER TRIPPED - Enrichment disabled until midnight',
          });
        }
      }
    }
  }

  async canProcessAI(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    circuitState: CircuitState;
  }> {
    const circuitState = await this.getCircuitState();

    if (circuitState === CircuitState.OPEN) {
      return {
        allowed: false,
        reason: 'Circuit breaker open - daily budget exceeded',
        circuitState,
      };
    }

    // Check per-user daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userToday = await this.prisma.aiCostTracking.groupBy({
      by: ['operation'],
      where: {
        userId,
        date: {
          gte: today,
        },
      },
      _count: {
        operation: true,
      },
    });

    const classifications = userToday.find((u) => u.operation === 'classification')?._count.operation || 0;
    const embeddings = userToday.find((u) => u.operation === 'embedding')?._count.operation || 0;

    if (classifications >= AI_COST_CONFIG.perUserDailyClassifications) {
      return {
        allowed: false,
        reason: 'Per-user daily classification limit reached',
        circuitState,
      };
    }

    if (embeddings >= AI_COST_CONFIG.perUserDailyEmbeddings) {
      return {
        allowed: false,
        reason: 'Per-user daily embedding limit reached',
        circuitState,
      };
    }

    return { allowed: true, circuitState };
  }

  async getDailySpendSummary(): Promise<{
    totalCents: number;
    percentUsed: number;
    operationCount: number;
    circuitState: CircuitState;
  }> {
    const totalCents = parseFloat((await this.redis.get(this.SPEND_KEY)) || '0');
    const circuitState = await this.getCircuitState();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.prisma.aiCostTracking.count({
      where: {
        date: {
          gte: today,
        },
      },
    });

    return {
      totalCents,
      percentUsed: (totalCents / AI_COST_CONFIG.globalDailyBudgetCents) * 100,
      operationCount: stats,
      circuitState,
    };
  }
}

