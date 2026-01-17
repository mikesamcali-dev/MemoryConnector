import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MemoryDecksService } from './memory-decks.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MemoryDeckSchedulerService {
  private readonly logger = new Logger(MemoryDeckSchedulerService.name);

  constructor(
    private memoryDecksService: MemoryDecksService,
    private prisma: PrismaService,
  ) {}

  /**
   * Runs every Sunday at midnight (0 0 * * 0)
   */
  @Cron('0 0 * * 0')
  async handleWeeklyDeckCreation() {
    this.logger.log('Starting weekly memory deck auto-creation...');

    try {
      // Get all users
      const users = await this.prisma.user.findMany({
        select: { id: true, email: true },
      });

      let successCount = 0;
      let errorCount = 0;

      // Create deck for each user
      for (const user of users) {
        try {
          await this.memoryDecksService.autoCreateWeeklyDeck(user.id);
          successCount++;
          this.logger.debug(`Created weekly deck for user ${user.email}`);
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to create deck for user ${user.email}:`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Weekly memory deck creation complete: ${successCount} succeeded, ${errorCount} failed`,
      );
    } catch (error) {
      this.logger.error('Weekly deck creation job failed:', error.stack);
    }
  }

  /**
   * Manual trigger for testing (admin only)
   */
  async triggerWeeklyCreation(userId: string) {
    return this.memoryDecksService.autoCreateWeeklyDeck(userId);
  }
}
