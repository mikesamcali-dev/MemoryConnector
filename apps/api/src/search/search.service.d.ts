import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
export interface SearchResult {
    memories: any[];
    method: 'semantic' | 'keyword';
    degraded: boolean;
    query: string;
    totalCount: number;
}
export declare class SearchService {
    private prisma;
    private embeddingsService;
    constructor(prisma: PrismaService, embeddingsService: EmbeddingsService);
    searchMemories(userId: string, query: string, limit?: number, offset?: number): Promise<SearchResult>;
    private keywordSearch;
}
//# sourceMappingURL=search.service.d.ts.map