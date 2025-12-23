import { MemoriesService } from './memories.service';
import { CreateMemoryDto } from './dto/create-memory.dto';
export declare class MemoriesController {
    private memoriesService;
    constructor(memoriesService: MemoriesService);
    create(createMemoryDto: CreateMemoryDto, user: any): Promise<{
        enrichmentQueued: boolean;
        enrichmentNote: string;
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
    findAll(user: any, skip?: string, take?: string): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
//# sourceMappingURL=memories.controller.d.ts.map