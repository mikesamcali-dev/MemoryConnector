import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrichmentProcessor } from './enrichment.processor';
import { logger } from '../common/logger';

@Injectable()
export class EnrichmentWorker implements OnModuleInit, OnModuleDestroy {
  private isRunning = false;
  private workerInterval: NodeJS.Timeout | null = null;
  private readonly pollIntervalMs: number;
  private readonly enabled: boolean;

  constructor(
    private processor: EnrichmentProcessor,
    private config: ConfigService
  ) {
    // Poll every 5 seconds by default, configurable via env
    this.pollIntervalMs = this.config.get<number>(
      'ENRICHMENT_POLL_INTERVAL_MS',
      5000
    );

    // Enable worker by default, can be disabled via env
    this.enabled = this.config.get<boolean>('ENRICHMENT_WORKER_ENABLED', true);
  }

  async onModuleInit() {
    if (!this.enabled) {
      logger.info('Enrichment worker is disabled via config');
      return;
    }

    logger.info(
      { pollIntervalMs: this.pollIntervalMs },
      'Starting enrichment worker'
    );

    this.isRunning = true;
    this.startWorker();
  }

  async onModuleDestroy() {
    logger.info('Stopping enrichment worker');
    this.isRunning = false;

    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
  }

  private startWorker() {
    // Process queue immediately on startup
    this.processQueue().catch((error) => {
      logger.error({ error }, 'Error in initial queue processing');
    });

    // Then set up interval for continuous processing
    this.workerInterval = setInterval(() => {
      if (this.isRunning) {
        this.processQueue().catch((error) => {
          logger.error({ error }, 'Error in queue processing interval');
        });
      }
    }, this.pollIntervalMs);
  }

  private async processQueue() {
    try {
      // Process all available jobs in the queue
      let jobsProcessed = 0;
      let hasMore = true;

      // Process up to 10 jobs per cycle to avoid blocking too long
      const maxJobsPerCycle = 10;

      while (hasMore && jobsProcessed < maxJobsPerCycle && this.isRunning) {
        hasMore = await this.processor.processNextJob();
        if (hasMore) {
          jobsProcessed++;
        }
      }

      if (jobsProcessed > 0) {
        logger.info(
          { jobsProcessed },
          'Enrichment worker processed jobs this cycle'
        );
      }
    } catch (error) {
      logger.error({ error }, 'Unexpected error in enrichment worker');
    }
  }

  /**
   * Manually trigger queue processing (useful for testing)
   */
  async triggerProcessing(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Worker is not running');
    }

    await this.processQueue();
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isActive: boolean;
    enabled: boolean;
    pollIntervalMs: number;
    lastProcessedAt: Date | null;
  } {
    return {
      isActive: this.isRunning,
      enabled: this.enabled,
      pollIntervalMs: this.pollIntervalMs,
      lastProcessedAt: null, // TODO: Track last processed timestamp
    };
  }
}
