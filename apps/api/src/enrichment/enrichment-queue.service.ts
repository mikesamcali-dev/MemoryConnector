import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { CircuitBreakerService, CircuitState } from '../ai-circuit-breaker/circuit-breaker.service';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '../common/logger';
import { AI_COST_CONFIG } from '../config/ai-cost.config';

interface EnrichmentJob {
  memoryId: string;
  userId: string;
  queuedAt: number;
  priority: 'normal' | 'deferred';
}

@Injectable()
export class EnrichmentQueueService {
  private readonly QUEUE_KEY = 'enrichment:queue';
  private readonly DEFERRED_QUEUE_KEY = 'enrichment:queue:deferred';

  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private circuitBreaker: CircuitBreakerService,
    private prisma: PrismaService
  ) {}

  async enqueueEnrichment(
    memoryId: string,
    userId: string
  ): Promise<{ queued: boolean; reason?: string }> {
    const { allowed, reason, circuitState } = await this.circuitBreaker.canProcessAI(userId);

    if (!allowed || circuitState === CircuitState.OPEN) {
      // Queue for later processing
      const job: EnrichmentJob = {
        memoryId,
        userId,
        queuedAt: Date.now(),
        priority: 'deferred',
      };

      await this.redis.lpush(this.DEFERRED_QUEUE_KEY, JSON.stringify(job));

      // Update memory state
      await this.prisma.memory.update({
        where: { id: memoryId },
        data: {
          enrichmentStatus: 'queued_budget',
          enrichmentQueuedAt: new Date(),
        },
      });

      logger.info({ memoryId, userId, reason }, 'Enrichment queued due to limits');
      return { queued: true, reason };
    }

    // Process normally
    const job: EnrichmentJob = {
      memoryId,
      userId,
      queuedAt: Date.now(),
      priority: 'normal',
    };

    await this.redis.lpush(this.QUEUE_KEY, JSON.stringify(job));

    return { queued: false };
  }

  async processEnrichmentJob(job: EnrichmentJob): Promise<void> {
    const { allowed, circuitState } = await this.circuitBreaker.canProcessAI(job.userId);

    if (!allowed && job.priority === 'normal') {
      // Re-queue as deferred
      logger.info({ job }, 'Re-queueing job as deferred');
      const deferredJob: EnrichmentJob = { ...job, priority: 'deferred' };
      await this.redis.lpush(this.DEFERRED_QUEUE_KEY, JSON.stringify(deferredJob));
      return;
    }

    if (circuitState === CircuitState.OPEN) {
      // Re-queue with longer delay
      await this.redis.lpush(this.DEFERRED_QUEUE_KEY, JSON.stringify(job));
      return;
    }

    // Process the enrichment (will be implemented in enrichment service)
    // await this.enrichmentService.performEnrichment(job.memoryId, job.userId);
  }

  async getNextJob(): Promise<EnrichmentJob | null> {
    // Try normal queue first
    const normalJob = await this.redis.rpop(this.QUEUE_KEY);
    if (normalJob) {
      return JSON.parse(normalJob);
    }

    // Then try deferred queue
    const deferredJob = await this.redis.rpop(this.DEFERRED_QUEUE_KEY);
    if (deferredJob) {
      return JSON.parse(deferredJob);
    }

    return null;
  }
}

