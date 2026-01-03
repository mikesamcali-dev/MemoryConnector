import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ACHIEVEMENTS, checkAchievement } from './achievements.config';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string) {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      return {
        achievements: [],
        unlockedCount: 0,
        totalCount: ACHIEVEMENTS.length,
        progress: 0,
      };
    }

    const unlocked = (stats.achievementsUnlocked as string[]) || [];
    const allAchievements = ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlocked: unlocked.includes(achievement.id),
      progress: this.getAchievementProgress(achievement, stats),
    }));

    return {
      achievements: allAchievements,
      unlockedCount: unlocked.length,
      totalCount: ACHIEVEMENTS.length,
      progress: Math.round((unlocked.length / ACHIEVEMENTS.length) * 100),
    };
  }

  /**
   * Check and unlock new achievements
   */
  async checkAndUnlockAchievements(userId: string) {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      return [];
    }

    const unlocked = (stats.achievementsUnlocked as string[]) || [];
    const newlyUnlocked: string[] = [];

    for (const achievement of ACHIEVEMENTS) {
      // Skip already unlocked achievements
      if (unlocked.includes(achievement.id)) continue;

      // Check if achievement requirement is met
      if (checkAchievement(achievement, stats)) {
        newlyUnlocked.push(achievement.id);
      }
    }

    // Update user stats with newly unlocked achievements
    if (newlyUnlocked.length > 0) {
      await this.prisma.userStats.update({
        where: { userId },
        data: {
          achievementsUnlocked: [...unlocked, ...newlyUnlocked],
        },
      });
    }

    return newlyUnlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)!);
  }

  /**
   * Update capture streak
   */
  async updateCaptureStreak(userId: string) {
    const stats = await this.prisma.userStats.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const now = new Date();
    const lastCapture = stats.lastCaptureDate;

    if (!lastCapture) {
      // First capture ever
      await this.prisma.userStats.update({
        where: { userId },
        data: {
          currentStreakDays: 1,
          longestStreakDays: 1,
          lastCaptureDate: now,
          totalMemoriesCreated: { increment: 1 },
        },
      });
      return await this.checkAndUnlockAchievements(userId);
    }

    const daysDiff = Math.floor(
      (now.getTime() - lastCapture.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Same day - just increment memory count
      await this.prisma.userStats.update({
        where: { userId },
        data: {
          totalMemoriesCreated: { increment: 1 },
        },
      });
    } else if (daysDiff === 1) {
      // Next day - increment streak
      const newStreak = stats.currentStreakDays + 1;
      await this.prisma.userStats.update({
        where: { userId },
        data: {
          currentStreakDays: newStreak,
          longestStreakDays: Math.max(newStreak, stats.longestStreakDays),
          lastCaptureDate: now,
          totalMemoriesCreated: { increment: 1 },
        },
      });
    } else {
      // Streak broken - reset to 1
      await this.prisma.userStats.update({
        where: { userId },
        data: {
          currentStreakDays: 1,
          lastCaptureDate: now,
          totalMemoriesCreated: { increment: 1 },
        },
      });
    }

    // Check for newly unlocked achievements
    return await this.checkAndUnlockAchievements(userId);
  }

  /**
   * Increment link count
   */
  async incrementLinkCount(userId: string) {
    await this.prisma.userStats.upsert({
      where: { userId },
      create: { userId, totalLinksCreated: 1 },
      update: { totalLinksCreated: { increment: 1 } },
    });

    return await this.checkAndUnlockAchievements(userId);
  }

  /**
   * Get achievement progress (0-100)
   */
  private getAchievementProgress(achievement: any, stats: any): number {
    const { type, value } = achievement.requirement;

    let current = 0;
    switch (type) {
      case 'capture_count':
        current = stats.totalMemoriesCreated;
        break;
      case 'review_count':
        current = stats.totalReviewsCompleted;
        break;
      case 'streak_days':
        current = Math.max(stats.currentStreakDays, stats.longestStreakDays);
        break;
      case 'link_count':
        current = stats.totalLinksCreated;
        break;
      case 'recall_rate':
        const totalReviews = stats.totalReviewsCompleted;
        if (totalReviews === 0) return 0;
        const successfulReviews = stats.totalReviewsGood + stats.totalReviewsEasy;
        current = (successfulReviews / totalReviews) * 100;
        break;
      default:
        return 0;
    }

    return Math.min(Math.round((current / value) * 100), 100);
  }
}
