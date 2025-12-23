import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TierBasedThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private prisma: PrismaService
  ) {
    super(options, storageService, reflector);
  }

  async getTracker(req: Request): Promise<string> {
    // Use user ID if authenticated, otherwise use IP
    const user = req['user'] as any;
    const userId = user?.id;
    return userId ? `user:${userId}` : `ip:${req.ip}`;
  }

  protected async getLimit(context: ExecutionContext): Promise<number> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req['user'] as any;
    const userId = user?.id;
    
    if (!userId) {
      // Unauthenticated: 100 req/min
      return 100;
    }

    try {
      // Get user tier
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true },
      });

      if (!user) {
        return 100; // Default
      }

      // Get tier limits
      const tierLimit = await this.prisma.tierLimit.findUnique({
        where: { tier: user.tier },
      });

      return tierLimit?.apiRatePerMin || 100;
    } catch (error) {
      // Fallback to default on error
      return 100;
    }
  }
}

