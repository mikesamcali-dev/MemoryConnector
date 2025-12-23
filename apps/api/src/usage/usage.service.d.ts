import { PrismaService } from '../prisma/prisma.service';
export interface UsageCheck {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: Date;
}
export declare class UsageService {
    private prisma;
    constructor(prisma: PrismaService);
    checkUsageLimit(userId: string, resource: 'memories' | 'images' | 'voice' | 'searches'): Promise<UsageCheck>;
    incrementUsage(userId: string, resource: 'memories' | 'images' | 'voice' | 'searches', amount?: number): Promise<void>;
    private getTomorrowReset;
    private getNextMonthReset;
}
//# sourceMappingURL=usage.service.d.ts.map