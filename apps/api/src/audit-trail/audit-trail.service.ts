import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditTrailFilters {
  userId?: string;
  eventType?: string;
  action?: string;
  entityName?: string;
  entityId?: string;
  success?: boolean;
  actorType?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditTrailService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: AuditTrailFilters) {
    const {
      userId,
      eventType,
      action,
      entityName,
      entityId,
      success,
      actorType,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (eventType) where.eventType = eventType;
    if (action) where.action = action;
    if (entityName) where.entityName = entityName;
    if (entityId) where.entityId = entityId;
    if (success !== undefined) where.success = success;
    if (actorType) where.actorType = actorType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Search across multiple text fields
    if (search) {
      where.OR = [
        { actorEmail: { contains: search, mode: 'insensitive' } },
        { errorCode: { contains: search, mode: 'insensitive' } },
        { errorMessage: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search } },
        { requestId: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.auditTrail.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditTrail.count({ where }),
    ]);

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return this.prisma.auditTrail.findUnique({
      where: { id },
    });
  }

  async getEventTypes() {
    const result = await this.prisma.auditTrail.groupBy({
      by: ['eventType'],
      _count: { eventType: true },
      orderBy: { _count: { eventType: 'desc' } },
    });

    return result.map((r) => ({
      eventType: r.eventType,
      count: r._count.eventType,
    }));
  }

  async getActions() {
    const result = await this.prisma.auditTrail.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    });

    return result.map((r) => ({
      action: r.action,
      count: r._count.action,
    }));
  }

  async getEntityNames() {
    const result = await this.prisma.auditTrail.groupBy({
      by: ['entityName'],
      where: { entityName: { not: null } },
      _count: { entityName: true },
      orderBy: { _count: { entityName: 'desc' } },
    });

    return result.map((r) => ({
      entityName: r.entityName,
      count: r._count.entityName,
    }));
  }

  async getStats() {
    const [
      total,
      totalSuccess,
      totalFailure,
      last24Hours,
      topEventTypes,
      topUsers,
    ] = await Promise.all([
      this.prisma.auditTrail.count(),
      this.prisma.auditTrail.count({ where: { success: true } }),
      this.prisma.auditTrail.count({ where: { success: false } }),
      this.prisma.auditTrail.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.auditTrail.groupBy({
        by: ['eventType'],
        _count: { eventType: true },
        orderBy: { _count: { eventType: 'desc' } },
        take: 10,
      }),
      this.prisma.auditTrail.groupBy({
        by: ['userId', 'actorEmail'],
        where: { userId: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      totalSuccess,
      totalFailure,
      successRate: total > 0 ? (totalSuccess / total) * 100 : 0,
      last24Hours,
      topEventTypes: topEventTypes.map((t) => ({
        eventType: t.eventType,
        count: t._count.eventType,
      })),
      topUsers: topUsers.map((u) => ({
        userId: u.userId,
        actorEmail: u.actorEmail,
        count: u._count.userId,
      })),
    };
  }

  async getTimelineForEntity(entityName: string, entityId: string) {
    return this.prisma.auditTrail.findMany({
      where: { entityName, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUserActivity(userId: string, days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.prisma.auditTrail.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create audit trail entry
   * This is called by middleware/interceptors
   */
  async create(data: any) {
    return this.prisma.auditTrail.create({
      data: {
        ...data,
        redactedFields: data.redactedFields || [],
        truncatedFields: data.truncatedFields || [],
      },
    });
  }
}
