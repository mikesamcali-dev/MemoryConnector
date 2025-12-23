import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

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
            textContent: true,
            type: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      take: 50,
    });

    return {
      unreadCount,
      reminders: reminders.map((r) => ({
        reminderId: r.id,
        memoryId: r.memoryId,
        memoryPreview: this.truncateText(r.memory.textContent, 60),
        memoryType: r.memory.type,
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

  private truncateText(text: string | null, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }
}
