import { Injectable } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentQueueService } from './enrichment-queue.service';
import { logger } from '../common/logger';

interface EnrichmentJob {
  memoryId: string;
  userId: string;
  queuedAt: number;
  priority: 'normal' | 'deferred';
}

@Injectable()
export class EnrichmentProcessor {
  constructor(
    private enrichmentService: EnrichmentService,
    private queueService: EnrichmentQueueService
  ) {}

  /**
   * Process a single enrichment job from the queue
   */
  async processJob(job: EnrichmentJob): Promise<void> {
    try {
      logger.info(
        {
          memoryId: job.memoryId,
          userId: job.userId,
          priority: job.priority,
          queuedAt: new Date(job.queuedAt).toISOString(),
        },
        'Processing enrichment job'
      );

      // Perform the enrichment
      await this.enrichmentService.performEnrichment(job.memoryId, job.userId);

      logger.info(
        { memoryId: job.memoryId, userId: job.userId },
        'Enrichment job completed successfully'
      );
    } catch (error) {
      logger.error(
        {
          error,
          memoryId: job.memoryId,
          userId: job.userId,
          priority: job.priority,
        },
        'Enrichment job failed'
      );

      // Job failure is already handled in EnrichmentService
      // (updates memory.enrichmentStatus to 'failed')
    }
  }

  /**
   * Process the next available job in the queue
   * Returns true if a job was processed, false if queue was empty
   */
  async processNextJob(): Promise<boolean> {
    const job = await this.queueService.getNextJob();

    if (!job) {
      return false;
    }

    await this.processJob(job);
    return true;
  }
}
