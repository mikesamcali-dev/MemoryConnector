import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '../common/logger';

@Injectable()
export class SamReviewSchedulingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a review schedule for a new SAM memory
   * Initial review scheduled for 1 day from now
   */
  async createSchedule(memoryId: string, userId: string): Promise<void> {
    const nextReviewDate = this.calculateNextReviewDate(1); // 1 day initial interval

    await this.prisma.samReviewSchedule.create({
      data: {
        memoryId,
        userId,
        currentInterval: 1,
        easeFactor: 2.3,
        nextReviewDate,
      },
    });

    logger.info({ memoryId, nextReviewDate }, 'Review schedule created');
  }

  /**
   * Get all due reviews for a user
   * Returns memories that need to be reviewed (nextReviewDate <= now)
   */
  async getDueReviews(userId: string, limit: number = 20) {
    const now = new Date();

    const schedules = await this.prisma.samReviewSchedule.findMany({
      where: {
        userId,
        isPaused: false,
        nextReviewDate: {
          lte: now,
        },
      },
      include: {
        memory: {
          include: {
            contextWindow: true,
            decayPolicy: true,
          },
        },
      },
      orderBy: {
        nextReviewDate: 'asc', // Oldest due first
      },
      take: limit,
    });

    return schedules;
  }

  /**
   * Get count of due reviews for a user
   */
  async getDueReviewCount(userId: string): Promise<number> {
    const now = new Date();

    return this.prisma.samReviewSchedule.count({
      where: {
        userId,
        isPaused: false,
        nextReviewDate: {
          lte: now,
        },
      },
    });
  }

  /**
   * Record a review attempt and update schedule based on spaced repetition algorithm
   *
   * Algorithm from Memory improvement logic.md:
   * - Initial interval: 1 day
   * - Ease factor default: 2.3
   * - Max interval: 30 days
   * - Success: interval = previous_interval * ease_factor
   * - Failure: interval = max(1, previous_interval / 2)
   */
  async recordReview(
    scheduleId: string,
    wasSuccessful: boolean,
    reviewType: 'recognition' | 'free_recall',
    responseTimeMs?: number,
  ) {
    const schedule = await this.prisma.samReviewSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error(`Review schedule ${scheduleId} not found`);
    }

    const intervalBefore = schedule.currentInterval;
    let newInterval: number;
    let newEaseFactor = schedule.easeFactor;
    let newConsecutiveSuccesses = schedule.consecutiveSuccesses;
    let newConsecutiveFailures = schedule.consecutiveFailures;

    if (wasSuccessful) {
      // Success: multiply interval by ease factor
      newInterval = Math.min(
        Math.round(intervalBefore * newEaseFactor),
        30, // Max 30 days
      );
      newConsecutiveSuccesses += 1;
      newConsecutiveFailures = 0;

      // Gradually increase ease factor for consistent successes
      if (newConsecutiveSuccesses >= 3) {
        newEaseFactor = Math.min(newEaseFactor + 0.1, 2.5);
      }
    } else {
      // Failure: halve interval, min 1 day
      newInterval = Math.max(1, Math.floor(intervalBefore / 2));
      newConsecutiveFailures += 1;
      newConsecutiveSuccesses = 0;

      // Reduce ease factor slightly on failure
      newEaseFactor = Math.max(newEaseFactor - 0.1, 1.3);
    }

    const nextReviewDate = this.calculateNextReviewDate(newInterval);

    // Update schedule
    await this.prisma.samReviewSchedule.update({
      where: { id: scheduleId },
      data: {
        currentInterval: newInterval,
        easeFactor: newEaseFactor,
        nextReviewDate,
        totalReviews: { increment: 1 },
        successfulReviews: wasSuccessful ? { increment: 1 } : undefined,
        consecutiveSuccesses: newConsecutiveSuccesses,
        consecutiveFailures: newConsecutiveFailures,
        lastReviewedAt: new Date(),
      },
    });

    // Record attempt
    await this.prisma.samReviewAttempt.create({
      data: {
        scheduleId,
        memoryId: schedule.memoryId,
        userId: schedule.userId,
        wasSuccessful,
        reviewType,
        responseTimeMs,
        intervalBefore,
        intervalAfter: newInterval,
      },
    });

    logger.info(
      {
        scheduleId,
        memoryId: schedule.memoryId,
        wasSuccessful,
        intervalBefore,
        intervalAfter: newInterval,
        nextReviewDate,
      },
      'Review recorded',
    );

    // Pause reviews after 3 consecutive failures (as per the document)
    if (newConsecutiveFailures >= 3) {
      await this.pauseSchedule(scheduleId);
      logger.warn({ scheduleId }, 'Schedule paused after 3 consecutive failures');
    }

    return { newInterval, nextReviewDate };
  }

  /**
   * Pause a review schedule
   */
  async pauseSchedule(scheduleId: string): Promise<void> {
    await this.prisma.samReviewSchedule.update({
      where: { id: scheduleId },
      data: { isPaused: true },
    });
  }

  /**
   * Resume a paused review schedule
   */
  async resumeSchedule(scheduleId: string): Promise<void> {
    await this.prisma.samReviewSchedule.update({
      where: { id: scheduleId },
      data: { isPaused: false },
    });
  }

  /**
   * Get review statistics for a user
   */
  async getReviewStats(userId: string) {
    const schedules = await this.prisma.samReviewSchedule.findMany({
      where: { userId },
      select: {
        totalReviews: true,
        successfulReviews: true,
      },
    });

    const totalReviews = schedules.reduce((sum, s) => sum + s.totalReviews, 0);
    const successfulReviews = schedules.reduce((sum, s) => sum + s.successfulReviews, 0);

    const attempts = await this.prisma.samReviewAttempt.findMany({
      where: { userId },
      select: {
        wasSuccessful: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate 7-day and 30-day retention rates
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last7Days = attempts.filter(a => a.createdAt >= sevenDaysAgo);
    const last30Days = attempts.filter(a => a.createdAt >= thirtyDaysAgo);

    return {
      totalReviews,
      successfulReviews,
      successRate: totalReviews > 0 ? successfulReviews / totalReviews : 0,
      retention7Day: last7Days.length > 0
        ? last7Days.filter(a => a.wasSuccessful).length / last7Days.length
        : 0,
      retention30Day: last30Days.length > 0
        ? last30Days.filter(a => a.wasSuccessful).length / last30Days.length
        : 0,
    };
  }

  /**
   * Calculate next review date based on interval in days
   */
  private calculateNextReviewDate(intervalDays: number): Date {
    const now = new Date();
    return new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  }
}
