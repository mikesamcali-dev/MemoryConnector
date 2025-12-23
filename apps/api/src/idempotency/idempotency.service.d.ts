import { PrismaService } from '../prisma/prisma.service';
export declare class IdempotencyService {
    private prisma;
    constructor(prisma: PrismaService);
    checkAndReserve(key: string, userId: string, endpoint: string, requestBody: any): Promise<{
        isReplay: boolean;
        response?: any;
    }>;
    storeResponse(key: string, statusCode: number, responseBody: any): Promise<void>;
}
//# sourceMappingURL=idempotency.service.d.ts.map