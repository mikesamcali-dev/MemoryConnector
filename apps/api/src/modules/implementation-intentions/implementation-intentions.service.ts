import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateIntentionDto, UpdateIntentionDto } from './dto';
import { ImplementationIntention, Frequency, TriggerType } from '@prisma/client';

@Injectable()
export class ImplementationIntentionsService {
  private readonly logger = new Logger(ImplementationIntentionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new implementation intention
   */
  async create(userId: string, dto: CreateIntentionDto): Promise<ImplementationIntention> {
    // Auto-generate if-then phrase if not provided
    const ifThenPhrase = dto.ifThenPhrase || this.generateIfThenPhrase(dto.triggerType, dto.triggerValue, dto.action);

    return this.prisma.implementationIntention.create({
      data: {
        userId,
        triggerType: dto.triggerType,
        triggerValue: dto.triggerValue,
        action: dto.action,
        ifThenPhrase,
        enabled: dto.enabled ?? true,
        frequency: dto.frequency || Frequency.DAILY,
        customDays: dto.customDays || [],
      },
    });
  }

  /**
   * Get all intentions for a user
   */
  async findAll(userId: string): Promise<ImplementationIntention[]> {
    return this.prisma.implementationIntention.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get active intentions for a user
   */
  async findActive(userId: string): Promise<ImplementationIntention[]> {
    return this.prisma.implementationIntention.findMany({
      where: {
        userId,
        enabled: true,
        isPaused: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get one intention
   */
  async findOne(userId: string, id: string): Promise<ImplementationIntention> {
    const intention = await this.prisma.implementationIntention.findFirst({
      where: { id, userId },
    });

    if (!intention) {
      throw new NotFoundException('Intention not found');
    }

    return intention;
  }

  /**
   * Update intention
   */
  async update(userId: string, id: string, dto: UpdateIntentionDto): Promise<ImplementationIntention> {
    await this.findOne(userId, id); // Check ownership

    return this.prisma.implementationIntention.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete intention
   */
  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id); // Check ownership

    await this.prisma.implementationIntention.delete({
      where: { id },
    });
  }

  /**
   * Mark intention as completed
   */
  async markCompleted(userId: string, id: string): Promise<ImplementationIntention> {
    await this.findOne(userId, id); // Check ownership

    return this.prisma.implementationIntention.update({
      where: { id },
      data: {
        completionCount: { increment: 1 },
        lastCompletedAt: new Date(),
        missedCount: 0, // Reset miss counter
      },
    });
  }

  /**
   * Snooze intention
   */
  async snooze(userId: string, id: string, minutes: number = 60): Promise<ImplementationIntention> {
    await this.findOne(userId, id); // Check ownership

    // For now, just update lastTriggeredAt to delay next trigger
    return this.prisma.implementationIntention.update({
      where: { id },
      data: {
        lastTriggeredAt: new Date(),
      },
    });
  }

  /**
   * Resume paused intention
   */
  async resume(userId: string, id: string): Promise<ImplementationIntention> {
    await this.findOne(userId, id); // Check ownership

    return this.prisma.implementationIntention.update({
      where: { id },
      data: {
        isPaused: false,
        pausedAt: null,
        missedCount: 0,
      },
    });
  }

  /**
   * Check and trigger intentions (run every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndTriggerIntentions(): Promise<void> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find TIME-based intentions matching current time
    const intentions = await this.prisma.implementationIntention.findMany({
      where: {
        enabled: true,
        isPaused: false,
        triggerType: TriggerType.TIME,
        triggerValue: currentTime,
      },
      include: { user: true },
    });

    for (const intention of intentions) {
      // Check if should trigger today
      if (!this.shouldTriggerToday(intention, now)) {
        continue;
      }

      // Check if already triggered in last hour (prevent duplicates)
      if (intention.lastTriggeredAt) {
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        if (intention.lastTriggeredAt > hourAgo) {
          continue; // Already triggered recently
        }
      }

      // Log trigger (in production, would create notification/reminder)
      this.logger.log(`Triggering intention ${intention.id} for user ${intention.userId}: ${intention.ifThenPhrase}`);

      // Update lastTriggeredAt
      await this.prisma.implementationIntention.update({
        where: { id: intention.id },
        data: {
          lastTriggeredAt: now,
        },
      });

      // Create reminder in RemindersService (would integrate with existing system)
      // For now, just log
    }

    if (intentions.length > 0) {
      this.logger.log(`Processed ${intentions.length} intention triggers at ${currentTime}`);
    }
  }

  /**
   * Handle missed intention (escalation logic)
   */
  async handleMiss(intentionId: string): Promise<void> {
    const intention = await this.prisma.implementationIntention.findUnique({
      where: { id: intentionId },
    });

    if (!intention) return;

    const newMissCount = intention.missedCount + 1;

    if (newMissCount >= 3) {
      // Third miss: pause and suggest simplification
      await this.prisma.implementationIntention.update({
        where: { id: intentionId },
        data: {
          isPaused: true,
          pausedAt: new Date(),
          missedCount: newMissCount,
        },
      });
      this.logger.warn(`Paused intention ${intentionId} after 3 consecutive misses`);
    } else {
      // Increment miss count
      await this.prisma.implementationIntention.update({
        where: { id: intentionId },
        data: {
          missedCount: newMissCount,
        },
      });
    }
  }

  /**
   * Generate if-then phrase
   */
  private generateIfThenPhrase(triggerType: TriggerType, triggerValue: string, action: string): string {
    switch (triggerType) {
      case TriggerType.TIME:
        return `If it's ${triggerValue}, then I'll ${action.toLowerCase()}`;
      case TriggerType.LOCATION:
        return `If I arrive at this location, then I'll ${action.toLowerCase()}`;
      case TriggerType.ROUTINE:
        return `If ${triggerValue}, then I'll ${action.toLowerCase()}`;
      case TriggerType.CONTEXT:
        return `If I'm ${triggerValue}, then I'll ${action.toLowerCase()}`;
      default:
        return `If ${triggerValue}, then I'll ${action.toLowerCase()}`;
    }
  }

  /**
   * Check if intention should trigger today
   */
  private shouldTriggerToday(intention: ImplementationIntention, date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

    switch (intention.frequency) {
      case Frequency.DAILY:
        return true;
      case Frequency.WEEKDAYS:
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case Frequency.WEEKENDS:
        return dayOfWeek === 0 || dayOfWeek === 6;
      case Frequency.CUSTOM:
        return intention.customDays.includes(dayOfWeek);
      default:
        return false;
    }
  }
}
