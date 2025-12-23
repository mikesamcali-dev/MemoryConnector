import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageService } from '../usage.service';
export declare class UsageLimitGuard implements CanActivate {
    private usageService;
    private reflector;
    constructor(usageService: UsageService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=usage-limit.guard.d.ts.map