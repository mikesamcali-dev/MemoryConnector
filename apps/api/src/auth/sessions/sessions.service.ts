import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  async createSession(userId: string): Promise<string> {
    // Generate refresh token
    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = await argon2.hash(refreshToken);

    // Calculate expiration (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Store session
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
      },
    });

    return refreshToken;
  }

  async validateAndRefresh(refreshToken: string): Promise<{ userId: string } | null> {
    // Get all non-expired sessions for this token
    const sessions = await this.prisma.session.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    // Find matching session
    for (const session of sessions) {
      try {
        const isValid = await argon2.verify(session.refreshTokenHash, refreshToken);
        if (isValid) {
          return { userId: session.userId };
        }
      } catch {
        // Continue to next session
      }
    }

    return null;
  }

  async revokeSession(refreshToken: string): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    for (const session of sessions) {
      try {
        const isValid = await argon2.verify(session.refreshTokenHash, refreshToken);
        if (isValid) {
          await this.prisma.session.delete({
            where: { id: session.id },
          });
          return;
        }
      } catch {
        // Continue to next session
      }
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

