import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class SessionsService {
    private prisma;
    private config;
    constructor(prisma: PrismaService, config: ConfigService);
    createSession(userId: string): Promise<string>;
    validateAndRefresh(refreshToken: string): Promise<{
        userId: string;
    } | null>;
    revokeSession(refreshToken: string): Promise<void>;
    cleanupExpiredSessions(): Promise<void>;
}
//# sourceMappingURL=sessions.service.d.ts.map