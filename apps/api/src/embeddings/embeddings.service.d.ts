import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from '../ai-circuit-breaker/circuit-breaker.service';
export declare class EmbeddingsService {
    private prisma;
    private circuitBreaker;
    private config;
    private openai;
    constructor(prisma: PrismaService, circuitBreaker: CircuitBreakerService, config: ConfigService);
    generateAndStoreEmbedding(memoryId: string, userId: string, text: string): Promise<void>;
    generateQueryEmbedding(query: string): Promise<number[]>;
    deleteEmbedding(memoryId: string): Promise<void>;
    searchSimilar(userId: string, queryVector: number[], limit?: number): Promise<Array<{
        memoryId: string;
        similarity: number;
    }>>;
}
//# sourceMappingURL=embeddings.service.d.ts.map