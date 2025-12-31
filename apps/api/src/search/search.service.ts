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
    // Simple case-insensitive search using ILIKE
    const searchPattern = `%${query}%`;

    const memories = await this.prisma.memory.findMany({
      where: {
        userId,
        state: { notIn: [MemoryState.DELETED, MemoryState.DRAFT] },
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            body: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // Get total count
    const totalCount = await this.prisma.memory.count({
      where: {
        userId,
        state: { notIn: [MemoryState.DELETED, MemoryState.DRAFT] },
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            body: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    return {
      memories: memories.map((m) => ({
        ...m,
        relevanceScore: 1.0, // Simple keyword search doesn't have relevance scoring
      })),
      method: 'keyword',
      degraded: true,
      query,
      totalCount,
    };
  }
}
