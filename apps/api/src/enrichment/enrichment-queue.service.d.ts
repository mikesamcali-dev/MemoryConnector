import Redis from 'ioredis';
import { CircuitBreakerService } from '../ai-circuit-breaker/circuit-breaker.service';
import { PrismaService } from '../prisma/prisma.service';
interface EnrichmentJob {
    memoryId: string;
    userId: string;
    queuedAt: number;
    priority: 'normal' | 'deferred';
}
export declare class EnrichmentQueueService {
    private redis;
    private circuitBreaker;
    private prisma;
    private readonly QUEUE_KEY;
    private readonly DEFERRED_QUEUE_KEY;
    constructor(redis: Redis, circuitBreaker: CircuitBreakerService, prisma: PrismaService);
    enqueueEnrichment(memoryId: string, userId: string): Promise<{
        queued: boolean;
        reason?: string;
    }>;
    processEnrichmentJob(job: EnrichmentJob): Promise<void>;
    getNextJob(): Promise<EnrichmentJob | null>;
}
export {};
//# sourceMappingURL=enrichment-queue.service.d.ts.map