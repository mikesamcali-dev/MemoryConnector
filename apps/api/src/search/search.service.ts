import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { MemoryState } from '@prisma/client';
import { logger } from '../common/logger';

export interface SearchResult {
  memories: any[];
  method: 'semantic' | 'keyword';
  degraded: boolean;
  query: string;
  totalCount: number;
}

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private embeddingsService: EmbeddingsService
  ) {}

  async searchMemories(
    userId: string,
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResult> {
    // Try semantic search first
    try {
      const queryVector = await this.embeddingsService.generateQueryEmbedding(query);
      const similar = await this.embeddingsService.searchSimilar(userId, queryVector, limit + offset);

      // Get memories for the similar embeddings
      const memoryIds = similar.slice(offset, offset + limit).map((s) => s.memoryId);
      
      if (memoryIds.length === 0) {
        return {
          memories: [],
          method: 'semantic',
          degraded: false,
          query,
          totalCount: 0,
        };
      }

      const memories = await this.prisma.memory.findMany({
        where: {
          id: { in: memoryIds },
          userId,
          state: { not: MemoryState.DELETED },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Sort by similarity score
      const memoriesWithSimilarity = memories.map((mem) => {
        const sim = similar.find((s) => s.memoryId === mem.id);
        return {
          ...mem,
          relevanceScore: sim?.similarity || 0,
        };
      });

      return {
        memories: memoriesWithSimilarity,
        method: 'semantic',
        degraded: false,
        query,
        totalCount: similar.length,
      };
    } catch (error) {
      logger.warn({ error, userId, query }, 'Semantic search failed, falling back to keyword');
      // Fallback to keyword search
      return this.keywordSearch(userId, query, limit, offset);
    }
  }

  private async keywordSearch(
    userId: string,
    query: string,
    limit: number,
    offset: number
  ): Promise<SearchResult> {
    // Convert query to tsquery format
    const words = query
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .map((w) => w.replace(/[^\w]/g, ''))
      .filter((w) => w.length > 0);

    if (words.length === 0) {
      return {
        memories: [],
        method: 'keyword',
        degraded: true,
        query,
        totalCount: 0,
      };
    }

    const tsQuery = words.join(' & ');

    // Use raw query for full-text search
    const result = await this.prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      type: string | null;
      text_content: string | null;
      image_url: string | null;
      state: string;
      created_at: Date;
      updated_at: Date;
      relevance_score: number;
    }>>`
      SELECT m.id, m.user_id, m.type, m.text_content, m.image_url, m.state, m.created_at, m.updated_at,
             ts_rank(text_search_vector, to_tsquery('english', ${tsQuery})) as relevance_score
      FROM memories m
      WHERE m.user_id = ${userId}::uuid
      AND m.state NOT IN ('DELETED', 'DRAFT')
      AND m.text_search_vector @@ to_tsquery('english', ${tsQuery})
      ORDER BY relevance_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count
    const countResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM memories m
      WHERE m.user_id = ${userId}::uuid
      AND m.state NOT IN ('DELETED', 'DRAFT')
      AND m.text_search_vector @@ to_tsquery('english', ${tsQuery})
    `;

    const totalCount = Number(countResult[0]?.count || 0);

    return {
      memories: result.map((r) => ({
        id: r.id,
        userId: r.user_id,
        type: r.type,
        textContent: r.text_content,
        imageUrl: r.image_url,
        state: r.state,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        relevanceScore: r.relevance_score,
      })),
      method: 'keyword',
      degraded: true,
      query,
      totalCount,
    };
  }
}
