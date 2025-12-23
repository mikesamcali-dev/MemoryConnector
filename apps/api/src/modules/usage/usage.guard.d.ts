import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageService } from './usage.service';
export declare const USAGE_RESOURCE_KEY = "usageResource";
export declare class UsageLimitGuard implements CanActivate {
    private reflector;
    private usageService;
    constructor(reflector: Reflector, usageService: UsageService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=usage.guard.d.ts.map