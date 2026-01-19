import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SamAuditService {
  constructor(private prisma: PrismaService) {}

  async logEvent(memoryId: string, eventType: string, details: any) {
    return this.prisma.samAuditEvent.create({
      data: {
        memoryId,
        eventType,
        details
      }
    });
  }

  async getHistory(memoryId: string) {
    return this.prisma.samAuditEvent.findMany({
      where: { memoryId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTimeline(limit: number = 100, offset: number = 0) {
    return this.prisma.samAuditEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }
}
