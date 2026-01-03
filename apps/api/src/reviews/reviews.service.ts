import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewRating } from './dto/submit-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get memories due for review using SRS algorithm
   */
  async getDueReviews(userId: string, limit: number = 20) {
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
   * Submit a review rating and update SRS intervals using SM-2 algorithm
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

    // Calculate new interval and ease factor using SM-2 algorithm
    const { newInterval, newEaseFactor } = this.calculateSM2(
      rating,
      memory.reviewCount || 0,
      memory.reviewInterval || 1,
      memory.easeFactor || 2.5,
    );

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

    return {
      memory: updatedMemory,
      nextReviewAt,
      intervalDays: newInterval,
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
