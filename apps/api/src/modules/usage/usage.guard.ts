import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageService, ResourceType } from './usage.service';

export const USAGE_RESOURCE_KEY = 'usageResource';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usageService: UsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.get<ResourceType>(
      USAGE_RESOURCE_KEY,
      context.getHandler(),
    );

    if (!resource) {
      return true; // No usage limit specified
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.user?.userId;

    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const check = await this.usageService.checkLimit(userId, resource);

    if (!check.allowed) {
      throw new HttpException(
        {
          error: 'LIMIT_EXCEEDED',
          message: `You've reached your ${resource} limit`,
          resource: check.resource,
          limit: check.limit,
          resetAt: check.resetAt.toISOString(),
          upgradeUrl: '/settings/upgrade',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Store remaining count in request for potential response headers
    request.usageRemaining = check.remaining;

    return true;
  }
}
