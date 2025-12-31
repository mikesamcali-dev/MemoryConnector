import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UsageCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  resource: string;
}

export type ResourceType = 'memories' | 'images' | 'voice' | 'searches';

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Reset counters if needed (called automatically before each check)
   */
  private async resetCounters(userId: string): Promise<void> {
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
  }

  /**
   * Check if user can perform action based on usage limits
   */
  async checkLimit(userId: string, resource: ResourceType): Promise<UsageCheck> {
    // Reset counters first
    await this.resetCounters(userId);

    // Get user tier and usage
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        u.tier,
        uu.memories_today,
        uu.memories_this_month,
        uu.images_this_month,
        uu.voice_this_month,
        uu.searches_today,
        uu.storage_bytes,
        uu.last_daily_reset,
        uu.last_monthly_reset,
        tl.memories_per_day,
        tl.memories_per_month,
        tl.images_per_month,
        tl.voice_per_month,
        tl.searches_per_day,
        tl.storage_bytes as storage_limit
      FROM users u
      JOIN user_usage uu ON u.id = uu.user_id
      JOIN tier_limits tl ON u.tier = tl.tier
      WHERE u.id = ${userId}::uuid
    `;

    if (!result || result.length === 0) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const data = result[0];

    // Calculate based on resource type
    switch (resource) {
      case 'memories': {
        const dailyLimit = data.memories_per_day;
        const monthlyLimit = data.memories_per_month;
        const dailyUsed = data.memories_today;
        const monthlyUsed = data.memories_this_month;

        const dailyAllowed = dailyLimit === -1 || dailyUsed < dailyLimit;
        const monthlyAllowed = monthlyLimit === -1 || monthlyUsed < monthlyLimit;

        const dailyRemaining = dailyLimit === -1 ? Infinity : dailyLimit - dailyUsed;
        const monthlyRemaining = monthlyLimit === -1 ? Infinity : monthlyLimit - monthlyUsed;

        return {
          allowed: dailyAllowed && monthlyAllowed,
          remaining: Math.min(dailyRemaining, monthlyRemaining),
          limit: dailyLimit,
          resetAt: dailyAllowed ? this.getNextMonthReset() : this.getTomorrowReset(),
          resource,
        };
      }

      case 'searches': {
        const limit = data.searches_per_day;
        const used = data.searches_today;
        const allowed = limit === -1 || used < limit;

        return {
          allowed,
          remaining: limit === -1 ? Infinity : limit - used,
          limit,
          resetAt: this.getTomorrowReset(),
          resource,
        };
      }

      case 'images': {
        const limit = data.images_per_month;
        const used = data.images_this_month;
        const allowed = limit === -1 || used < limit;

        return {
          allowed,
          remaining: limit === -1 ? Infinity : limit - used,
          limit,
          resetAt: this.getNextMonthReset(),
          resource,
        };
      }

      case 'voice': {
        const limit = data.voice_per_month;
        const used = data.voice_this_month;
        const allowed = limit === -1 || used < limit;

        return {
          allowed,
          remaining: limit === -1 ? Infinity : limit - used,
          limit,
          resetAt: this.getNextMonthReset(),
          resource,
        };
      }

      default:
        throw new HttpException('Invalid resource type', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Increment usage counter after successful action
   */
  async incrementUsage(userId: string, resource: ResourceType): Promise<void> {
    switch (resource) {
      case 'memories':
        await this.prisma.$executeRaw`
          UPDATE user_usage 
          SET memories_today = memories_today + 1,
              memories_this_month = memories_this_month + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}::uuid
        `;
        break;

      case 'searches':
        await this.prisma.$executeRaw`
          UPDATE user_usage 
          SET searches_today = searches_today + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}::uuid
        `;
        break;

      case 'images':
        await this.prisma.$executeRaw`
          UPDATE user_usage 
          SET images_this_month = images_this_month + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}::uuid
        `;
        break;

      case 'voice':
        await this.prisma.$executeRaw`
          UPDATE user_usage 
          SET voice_this_month = voice_this_month + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}::uuid
        `;
        break;
    }
  }

  /**
   * Get all usage stats for a user
   */
  async getUserUsage(userId: string) {
    await this.resetCounters(userId);

    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        u.tier,
        uu.*,
        tl.memories_per_day,
        tl.memories_per_month,
        tl.images_per_month,
        tl.voice_per_month,
        tl.searches_per_day,
        tl.storage_bytes as storage_limit
      FROM users u
      JOIN user_usage uu ON u.id = uu.user_id
      JOIN tier_limits tl ON u.tier = tl.tier
      WHERE u.id = ${userId}::uuid
    `;

    if (!result || result.length === 0) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const data = result[0];

    // Convert BigInt values to numbers for JSON serialization
    return {
      tier: data.tier,
      memories_today: Number(data.memories_today),
      memories_this_month: Number(data.memories_this_month),
      images_this_month: Number(data.images_this_month),
      voice_this_month: Number(data.voice_this_month),
      searches_today: Number(data.searches_today),
      storage_bytes: Number(data.storage_bytes),
      memories_per_day: Number(data.memories_per_day),
      memories_per_month: Number(data.memories_per_month),
      images_per_month: Number(data.images_per_month),
      voice_per_month: Number(data.voice_per_month),
      searches_per_day: Number(data.searches_per_day),
      storage_limit: Number(data.storage_limit),
    };
  }

  private getTomorrowReset(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private getNextMonthReset(): Date {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth;
  }
}
