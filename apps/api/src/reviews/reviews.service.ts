import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewRating } from './dto/submit-review.dto';
import { UserMemoryService } from '../modules/user-memory/user-memory.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private userMemoryService: UserMemoryService,
  ) {}

  /**
   * Get memories due for review using SRS algorithm (with adaptive content if onboarded)
   */
  async getDueReviews(userId: string, limit: number = 20) {
    // Check if user has completed onboarding
    const profile = await this.userMemoryService.getProfile(userId);

    if (profile?.onboardingCompleted) {
      // Use adaptive retrieval
      const reviews = await this.userMemoryService.getAdaptiveDueReviews(userId, limit);
      return {
        reviews,
        count: reviews.length,
        adaptive: true,
      };
    }

    // Fallback to standard SRS
    const now = new Date();

    const dueMemories = await this.prisma.memory.findMany({
      where: {
        userId,
        state: 'SAVED',
        OR: [
          // Never reviewed before - show after 1 day
          {
            lastReviewedAt: null,
            createdAt: {
              lte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
            },
          },
          // Due for review
          {
            nextReviewAt: {
              lte: now,
            },
          },
        ],
      },
      orderBy: [
        { nextReviewAt: 'asc' },
        { createdAt: 'asc' },
      ],
      take: limit,
      include: {
        location: true,
        person: true,
        youtubeVideo: true,
        tiktokVideo: true,
        wordLinks: {
          include: {
            word: true,
          },
        },
      },
    });

    return {
      reviews: dueMemories,
      count: dueMemories.length,
      adaptive: false,
    };
  }

  /**
   * Get review statistics for a user
   */
  async getReviewStats(userId: string) {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      // Create initial stats if not exists
      return await this.prisma.userStats.create({
        data: { userId },
      });
    }

    // Calculate recall success rate
    const totalReviews = stats.totalReviewsCompleted;
    const successfulReviews = stats.totalReviewsGood + stats.totalReviewsEasy;
    const recallSuccessRate = totalReviews > 0
      ? Math.round((successfulReviews / totalReviews) * 100)
      : 0;

    return {
      ...stats,
      recallSuccessRate,
    };
  }

  /**
   * Submit a review rating and update SRS intervals using SM-2 algorithm (with personalization if onboarded)
   */
  async submitReview(userId: string, memoryId: string, rating: ReviewRating) {
    // Verify memory belongs to user
    const memory = await this.prisma.memory.findUnique({
      where: { id: memoryId },
    });

    if (!memory) {
      throw new NotFoundException('Memory not found');
    }

    if (memory.userId !== userId) {
      throw new ForbiddenException('Not authorized to review this memory');
    }

    // Get personalized config if available
    const config = await this.userMemoryService.getPersonalizedReviewConfig(userId);
    const profile = await this.userMemoryService.getProfile(userId);

    // Calculate new interval and ease factor using SM-2 algorithm
    let { newInterval, newEaseFactor } = this.calculateSM2(
      rating,
      memory.reviewCount || 0,
      memory.reviewInterval || 1,
      memory.easeFactor || 2.5,
    );

    // Apply personalization if available
    if (config && profile?.onboardingCompleted) {
      newInterval = Math.round(newInterval * config.intervalMultiplier * profile.optimalReviewInterval);
      newInterval = Math.min(newInterval, config.maxInterval);
      newInterval = Math.max(newInterval, 1);
    }

    const now = new Date();
    const nextReviewAt = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

    // Update memory
    const updatedMemory = await this.prisma.memory.update({
      where: { id: memoryId },
      data: {
        lastReviewedAt: now,
        nextReviewAt,
        reviewInterval: newInterval,
        easeFactor: newEaseFactor,
        reviewCount: { increment: 1 },
        lapseCount: rating === ReviewRating.AGAIN ? { increment: 1 } : undefined,
      },
    });

    // Update user stats
    await this.updateUserStats(userId, rating);

    // Record for daily check-in tracking
    if (profile?.onboardingCompleted) {
      await this.userMemoryService.recordReviewCompletion(userId, memoryId, rating);
    }

    return {
      memory: updatedMemory,
      nextReviewAt,
      intervalDays: newInterval,
      personalized: profile?.onboardingCompleted || false,
    };
  }

  /**
   * SM-2 Algorithm for spaced repetition
   * Based on SuperMemo 2 algorithm
   */
  private calculateSM2(
    rating: ReviewRating,
    reviewCount: number,
    currentInterval: number,
    currentEaseFactor: number,
  ): { newInterval: number; newEaseFactor: number } {
    // Convert rating to quality score (0-5)
    const quality = {
      [ReviewRating.AGAIN]: 0,
      [ReviewRating.HARD]: 3,
      [ReviewRating.GOOD]: 4,
      [ReviewRating.EASY]: 5,
    }[rating];

    // Calculate new ease factor
    let newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Ease factor should be at least 1.3
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }

    let newInterval: number;

    if (quality < 3) {
      // If rating is "Again", restart the interval
      newInterval = 1;
    } else {
      // Calculate interval based on review count
      if (reviewCount === 0) {
        newInterval = 1;
      } else if (reviewCount === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentInterval * newEaseFactor);
      }
    }

    return { newInterval, newEaseFactor };
  }

  /**
   * Update user statistics after a review
   */
  private async updateUserStats(userId: string, rating: ReviewRating) {
    // Ensure user stats exist
    await this.prisma.userStats.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Increment appropriate counters
    const updateData: any = {
      totalReviewsCompleted: { increment: 1 },
    };

    switch (rating) {
      case ReviewRating.AGAIN:
        updateData.totalReviewsAgain = { increment: 1 };
        break;
      case ReviewRating.HARD:
        updateData.totalReviewsHard = { increment: 1 };
        break;
      case ReviewRating.GOOD:
        updateData.totalReviewsGood = { increment: 1 };
        break;
      case ReviewRating.EASY:
        updateData.totalReviewsEasy = { increment: 1 };
        break;
    }

    await this.prisma.userStats.update({
      where: { userId },
      data: updateData,
    });
  }

  /**
   * Get count of reviews due today
   */
  async getDueCount(userId: string): Promise<number> {
    const now = new Date();

    return await this.prisma.memory.count({
      where: {
        userId,
        state: 'SAVED',
        OR: [
          {
            lastReviewedAt: null,
            createdAt: {
              lte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
          {
            nextReviewAt: {
              lte: now,
            },
          },
        ],
      },
    });
  }
}
