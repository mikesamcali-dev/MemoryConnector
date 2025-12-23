import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface UsageCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  async checkUsageLimit(
    userId: string,
    resource: 'memories' | 'images' | 'voice' | 'searches'
  ): Promise<UsageCheck> {
    // Reset counters if needed using raw SQL for date operations
    await this.prisma.$executeRaw`
      UPDATE user_usage SET
        memories_today = CASE WHEN last_daily_reset < CURRENT_DATE THEN 0 ELSE memories_today END,
        searches_today = CASE WHEN last_daily_reset < CURRENT_DATE THEN 0 ELSE searches_today END,
        last_daily_reset = CASE WHEN last_daily_reset < CURRENT_DATE THEN CURRENT_DATE ELSE last_daily_reset END,
        memories_this_month = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 ELSE memories_this_month END,
        images_this_month = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 ELSE images_this_month END,
        voice_this_month = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN 0 ELSE voice_this_month END,
        last_monthly_reset = CASE WHEN last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE) THEN DATE_TRUNC('month', CURRENT_DATE) ELSE last_monthly_reset END
      WHERE user_id = ${userId}::uuid
    `;

    // Get user tier and limits
    const result = await this.prisma.$queryRaw<Array<{
      tier: string;
      memories_today: number;
      memories_this_month: number;
      images_this_month: number;
      voice_this_month: number;
      searches_today: number;
      memories_per_day: number;
      memories_per_month: number;
      images_per_month: number;
      voice_per_month: number;
      searches_per_day: number;
    }>>`
      SELECT u.tier, uu.*, tl.*
      FROM users u
      JOIN user_usage uu ON u.id = uu.user_id
      JOIN tier_limits tl ON u.tier = tl.tier
      WHERE u.id = ${userId}::uuid
    `;

    if (result.length === 0) {
      throw new HttpException('User usage record not found', HttpStatus.NOT_FOUND);
    }

    const data = result[0];
    const limits = {
      memoriesPerDay: data.memories_per_day,
      memoriesPerMonth: data.memories_per_month,
      imagesPerMonth: data.images_per_month,
      voicePerMonth: data.voice_per_month,
      searchesPerDay: data.searches_per_day,
    };

    const usage = {
      memoriesToday: data.memories_today,
      memoriesThisMonth: data.memories_this_month,
      imagesThisMonth: data.images_this_month,
      voiceThisMonth: data.voice_this_month,
      searchesToday: data.searches_today,
    };

    switch (resource) {
      case 'memories': {
        const dailyAllowed =
          limits.memoriesPerDay === -1 || usage.memoriesToday < limits.memoriesPerDay;
        const monthlyAllowed =
          limits.memoriesPerMonth === -1 || usage.memoriesThisMonth < limits.memoriesPerMonth;
        return {
          allowed: dailyAllowed && monthlyAllowed,
          remaining: Math.min(
            limits.memoriesPerDay === -1 ? Infinity : limits.memoriesPerDay - usage.memoriesToday,
            limits.memoriesPerMonth === -1
              ? Infinity
              : limits.memoriesPerMonth - usage.memoriesThisMonth
          ),
          limit: limits.memoriesPerDay,
          resetAt: dailyAllowed ? this.getNextMonthReset() : this.getTomorrowReset(),
        };
      }
      case 'images':
        return {
          allowed: limits.imagesPerMonth === -1 || usage.imagesThisMonth < limits.imagesPerMonth,
          remaining:
            limits.imagesPerMonth === -1
              ? Infinity
              : limits.imagesPerMonth - usage.imagesThisMonth,
          limit: limits.imagesPerMonth,
          resetAt: this.getNextMonthReset(),
        };
      case 'voice':
        return {
          allowed: limits.voicePerMonth === -1 || usage.voiceThisMonth < limits.voicePerMonth,
          remaining:
            limits.voicePerMonth === -1 ? Infinity : limits.voicePerMonth - usage.voiceThisMonth,
          limit: limits.voicePerMonth,
          resetAt: this.getNextMonthReset(),
        };
      case 'searches':
        return {
          allowed: limits.searchesPerDay === -1 || usage.searchesToday < limits.searchesPerDay,
          remaining:
            limits.searchesPerDay === -1 ? Infinity : limits.searchesPerDay - usage.searchesToday,
          limit: limits.searchesPerDay,
          resetAt: this.getTomorrowReset(),
        };
      default:
        return { allowed: true, remaining: Infinity, limit: -1, resetAt: new Date() };
    }
  }

  async incrementUsage(
    userId: string,
    resource: 'memories' | 'images' | 'voice' | 'searches',
    amount: number = 1
  ): Promise<void> {
    if (resource === 'memories') {
      await this.prisma.userUsage.update({
        where: { userId },
        data: {
          memoriesToday: { increment: amount },
          memoriesThisMonth: { increment: amount },
        },
      });
    } else if (resource === 'images') {
      await this.prisma.userUsage.update({
        where: { userId },
        data: {
          imagesThisMonth: { increment: amount },
        },
      });
    } else if (resource === 'voice') {
      await this.prisma.userUsage.update({
        where: { userId },
        data: {
          voiceThisMonth: { increment: amount },
        },
      });
    } else if (resource === 'searches') {
      await this.prisma.userUsage.update({
        where: { userId },
        data: {
          searchesToday: { increment: amount },
        },
      });
    }
  }

  private getTomorrowReset(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private getNextMonthReset(): Date {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    next.setHours(0, 0, 0, 0);
    return next;
  }
}

