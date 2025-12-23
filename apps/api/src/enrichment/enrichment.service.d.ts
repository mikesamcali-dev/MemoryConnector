import { PrismaService } from '../prisma/prisma.service';
import { CircuitBreakerService } from '../ai-circuit-breaker/circuit-breaker.service';
import { EnrichmentQueueService } from './enrichment-queue.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ConfigService } from '@nestjs/config';
export declare class EnrichmentService {
    private prisma;
    private circuitBreaker;
    private queueService;
    private embeddingsService;
    private config;
    private openai;
    constructor(prisma: PrismaService, circuitBreaker: CircuitBreakerService, queueService: EnrichmentQueueService, embeddingsService: EmbeddingsService, config: ConfigService);
    performEnrichment(memoryId: string, userId: string): Promise<void>;
    private classifyMemory;
    private generateEmbedding;
}
//# sourceMappingURL=enrichment.service.d.ts.map