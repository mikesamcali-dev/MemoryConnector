import { PrismaService } from '../prisma/prisma.service';
export declare class DuplicateDetectionService {
    private prisma;
    constructor(prisma: PrismaService);
    computeContentHash(text: string, imageUrl?: string): string;
    checkRecentDuplicate(userId: string, contentHash: string, windowSeconds?: number): Promise<{
        isDuplicate: boolean;
        existingMemoryId?: string;
    }>;
}
//# sourceMappingURL=duplicate-detection.service.d.ts.map