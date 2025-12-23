import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { DuplicateDetectionService } from '../duplicate-detection/duplicate-detection.service';
import { EnrichmentQueueService } from '../enrichment/enrichment-queue.service';
import { CreateMemoryDto } from './dto/create-memory.dto';
export declare class MemoriesService {
    private prisma;
    private usageService;
    private duplicateDetection;
    private enrichmentQueue;
    constructor(prisma: PrismaService, usageService: UsageService, duplicateDetection: DuplicateDetectionService, enrichmentQueue: EnrichmentQueueService);
    create(userId: string, createMemoryDto: CreateMemoryDto): Promise<{
        enrichmentQueued: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.MemoryType | null;
        state: import("@prisma/client").$Enums.MemoryState;
        textContent: string | null;
        imageUrl: string | null;
        contentHash: string | null;
        enrichmentStatus: import("@prisma/client").$Enums.EnrichmentStatus;
        enrichmentQueuedAt: Date | null;
    }>;
    findAll(userId: string, skip?: number, take?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.MemoryType | null;
        state: import("@prisma/client").$Enums.MemoryState;
        textContent: string | null;
        imageUrl: string | null;
        contentHash: string | null;
        enrichmentStatus: import("@prisma/client").$Enums.EnrichmentStatus;
        enrichmentQueuedAt: Date | null;
    }[]>;
    findOne(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.MemoryType | null;
        state: import("@prisma/client").$Enums.MemoryState;
        textContent: string | null;
        imageUrl: string | null;
        contentHash: string | null;
        enrichmentStatus: import("@prisma/client").$Enums.EnrichmentStatus;
        enrichmentQueuedAt: Date | null;
    }>;
}
//# sourceMappingURL=memories.service.d.ts.map