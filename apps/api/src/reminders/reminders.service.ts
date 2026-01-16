import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    private userPreferencesService: UserPreferencesService,
  ) {}

  async getInbox(userId: string) {
    // Get unread count
    const unreadCount = await this.prisma.reminder.count({
      where: {
        userId,
        status: 'sent',
        readAt: null,
        dismissedAt: null,
      },
    });

    // Get recent reminders (last 30 days)
    const reminders = await this.prisma.reminder.findMany({
      where: {
        userId,
        status: 'sent',
        dismissedAt: null,
        scheduledAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        memory: {
          select: {
            id: true,
            title: true,
            body: true,
            imageUrl: true,
            typeAssignments: {
              include: {
                memoryType: {
                  select: {
                    code: true,
                    label: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      take: 1000,
    });

    return {
      unreadCount,
      reminders: reminders.map((r) => ({
        reminderId: r.id,
        memoryId: r.memoryId,
        memoryPreview: this.truncateText(r.memory.title || r.memory.body || '', 60),
        memoryTypes: r.memory.typeAssignments.map((a) => a.memoryType.label),
        hasImage: !!r.memory.imageUrl,
        scheduledAt: r.scheduledAt,
        sentAt: r.sentAt,
        readAt: r.readAt,
      })),
    };
  }

  async markAsRead(userId: string, reminderId: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId,
        readAt: null,
      },
    });

    if (!reminder) {
      throw new HttpException('Reminder not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.reminder.update({
      where: { id: reminderId },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  async dismiss(userId: string, reminderId: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId,
        dismissedAt: null,
      },
    });

    if (!reminder) {
      throw new HttpException('Reminder not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.reminder.update({
      where: { id: reminderId },
      data: { dismissedAt: new Date() },
    });

    return { success: true };
  }

  async getUpcoming(userId: string, limit: number = 5) {
    const now = new Date();

    // Get pending and upcoming reminders (within the next 7 days or overdue)
    const reminders = await this.prisma.reminder.findMany({
      where: {
        userId,
        status: 'pending',
        dismissedAt: null,
        memory: {
          state: {
            not: 'DELETED',
          },
        },
      },
      include: {
        memory: {
          select: {
            id: true,
            title: true,
            body: true,
            imageUrl: true,
            state: true,
            typeAssignments: {
              include: {
                memoryType: {
                  select: {
                    code: true,
                    label: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: limit,
    });

    console.log(`Found ${reminders.length} upcoming reminders for user ${userId}`);

    return reminders.map((r) => ({
      reminderId: r.id,
      memoryId: r.memoryId,
      memoryPreview: this.truncateText(r.memory.title || r.memory.body || '', 100),
      memoryTypes: r.memory.typeAssignments.map((a) => a.memoryType.label),
      hasImage: !!r.memory.imageUrl,
      scheduledAt: r.scheduledAt,
      isOverdue: r.scheduledAt < now,
    }));
  }

  async getForMemory(userId: string, memoryId: string) {
    // Verify the memory belongs to the user
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    // Get all reminders for this memory, excluding those in slide decks
    const reminders = await this.prisma.reminder.findMany({
      where: {
        memoryId,
        userId,
        dismissedAt: null,
        slide: null, // Exclude reminders that are part of a slide deck
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return reminders;
  }

  async updateScheduledTime(userId: string, reminderId: string, newScheduledAt: Date) {
    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId,
      },
    });

    if (!reminder) {
      throw new HttpException('Reminder not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.reminder.update({
      where: { id: reminderId },
      data: { scheduledAt: newScheduledAt },
    });
  }

  async deleteReminder(userId: string, reminderId: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId,
      },
    });

    if (!reminder) {
      throw new HttpException('Reminder not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.reminder.delete({
      where: { id: reminderId },
    });

    return { success: true };
  }

  async createSRSReminders(userId: string, memoryId: string) {
    // Verify the memory belongs to the user
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    // Get user's reminder preferences
    const preferences = await this.userPreferencesService.getReminderPreferences(userId);

    if (!preferences.remindersEnabled) {
      throw new HttpException('Reminders are disabled for this user', HttpStatus.BAD_REQUEST);
    }

    const now = new Date();
    const intervals = [
      preferences.firstReminderMinutes,
      preferences.secondReminderMinutes,
      preferences.thirdReminderMinutes,
    ];

    // Create three reminders based on user preferences
    const reminders = await Promise.all(
      intervals.map((minutes, index) => {
        const scheduledAt = new Date(now.getTime() + minutes * 60 * 1000);
        return this.prisma.reminder.create({
          data: {
            userId,
            memoryId,
            scheduledAt,
            status: 'pending',
          },
        });
      })
    );

    console.log(`Created ${reminders.length} SRS reminders for memory ${memoryId}`);

    return {
      success: true,
      remindersCreated: reminders.length,
      reminders: reminders.map((r) => ({
        id: r.id,
        scheduledAt: r.scheduledAt,
      })),
    };
  }

  async createCustomReminder(userId: string, memoryId: string, scheduledAt: Date) {
    // Verify the memory belongs to the user
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    // Create the reminder
    const reminder = await this.prisma.reminder.create({
      data: {
        userId,
        memoryId,
        scheduledAt,
        status: 'pending',
      },
    });

    console.log(`Created custom reminder for memory ${memoryId} scheduled at ${scheduledAt}`);

    return {
      success: true,
      reminder: {
        id: reminder.id,
        scheduledAt: reminder.scheduledAt,
      },
    };
  }

  async getDueRemindersCount(userId: string): Promise<number> {
    const now = new Date();
    const count = await this.prisma.reminder.count({
      where: {
        userId,
        status: 'pending',
        scheduledAt: {
          lte: now,
        },
        dismissedAt: null,
      },
    });
    return count;
  }

  private truncateText(text: string | null, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }
}
