import { PrismaService } from '../../prisma/prisma.service';
export interface UsageCheck {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: Date;
    resource: string;
}
export type ResourceType = 'memories' | 'images' | 'voice' | 'searches';
export declare class UsageService {
    private prisma;
    constructor(prisma: PrismaService);
    private resetCounters;
    checkLimit(userId: string, resource: ResourceType): Promise<UsageCheck>;
    incrementUsage(userId: string, resource: ResourceType): Promise<void>;
    getUserUsage(userId: string): Promise<any>;
    private getTomorrowReset;
    private getNextMonthReset;
}
//# sourceMappingURL=usage.service.d.ts.map