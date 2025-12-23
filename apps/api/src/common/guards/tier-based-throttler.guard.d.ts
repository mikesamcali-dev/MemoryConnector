import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
export declare class TierBasedThrottlerGuard extends ThrottlerGuard {
    private prisma;
    constructor(options: ThrottlerOptions, prisma: PrismaService);
    getTracker(req: Request): Promise<string>;
    getLimit(req: Request): Promise<number>;
}
//# sourceMappingURL=tier-based-throttler.guard.d.ts.map