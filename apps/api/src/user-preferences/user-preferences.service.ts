import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserPreferencesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create user reminder preferences
   */
  async getReminderPreferences(userId: string) {
    let prefs = await this.prisma.userReminderPreferences.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!prefs) {
      prefs = await this.prisma.userReminderPreferences.create({
        data: {
          userId,
          firstReminderMinutes: 3,        // 3 minutes
          secondReminderMinutes: 4320,    // 3 days (72 hours)
          thirdReminderMinutes: 30240,    // 3 weeks (21 days)
          remindersEnabled: true,
        },
      });
    }

    return prefs;
  }

  /**
   * Update user reminder preferences
   */
  async updateReminderPreferences(
    userId: string,
    data: {
      firstReminderMinutes?: number;
      secondReminderMinutes?: number;
      thirdReminderMinutes?: number;
      remindersEnabled?: boolean;
    }
  ) {
    // Validate intervals are positive
    if (data.firstReminderMinutes !== undefined && data.firstReminderMinutes <= 0) {
      throw new HttpException('First reminder interval must be positive', HttpStatus.BAD_REQUEST);
    }
    if (data.secondReminderMinutes !== undefined && data.secondReminderMinutes <= 0) {
      throw new HttpException('Second reminder interval must be positive', HttpStatus.BAD_REQUEST);
    }
    if (data.thirdReminderMinutes !== undefined && data.thirdReminderMinutes <= 0) {
      throw new HttpException('Third reminder interval must be positive', HttpStatus.BAD_REQUEST);
    }

    const prefs = await this.prisma.userReminderPreferences.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        firstReminderMinutes: data.firstReminderMinutes ?? 3,
        secondReminderMinutes: data.secondReminderMinutes ?? 4320,
        thirdReminderMinutes: data.thirdReminderMinutes ?? 30240,
        remindersEnabled: data.remindersEnabled ?? true,
      },
    });

    return prefs;
  }
}
