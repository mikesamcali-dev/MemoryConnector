import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Delete expired speech sessions (every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions() {
    const now = new Date();

    const deleted = await this.prisma.speechSession.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    this.logger.log(`Cleaned up ${deleted.count} expired speech sessions`);
  }

  /**
   * Delete old feedback (older than 90 days, only for non-consented)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldFeedback() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const deleted = await this.prisma.transcriptFeedback.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        consentStore: false,
      },
    });

    this.logger.log(`Cleaned up ${deleted.count} old transcript feedback records`);
  }
}
