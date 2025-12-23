import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageService } from '../usage.service';
import { USAGE_RESOURCE_KEY } from '../decorators/usage-resource.decorator';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private usageService: UsageService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<'memories' | 'images' | 'voice' | 'searches'>(
      USAGE_RESOURCE_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!resource) {
      return true; // No resource limit specified
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const check = await this.usageService.checkUsageLimit(user.id, resource);

    if (!check.allowed) {
      throw new HttpException(
        {
          error: 'LIMIT_EXCEEDED',
          resource,
          limit: check.limit,
          resetAt: check.resetAt.toISOString(),
          upgradeUrl: '/settings/upgrade',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Attach remaining count to request
    request['usageRemaining'] = check.remaining;

    return true;
  }
}

