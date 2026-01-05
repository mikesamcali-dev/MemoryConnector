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

export interface UnifiedSearchResult {
  query: string;
  memories: {
    results: any[];
    count: number;
    method: 'semantic' | 'keyword';
    degraded: boolean;
  };
  projects: { results: any[]; count: number };
  images: { results: any[]; count: number };
  urlPages: { results: any[]; count: number };
  youtubeVideos: { results: any[]; count: number };
  tiktokVideos: { results: any[]; count: number };
  people: { results: any[]; count: number };
  locations: { results: any[]; count: number };
  totalResults: number;
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

  // ========== Unified Search Methods ==========

  async searchProjects(userId: string, query: string, limit: number) {
    return this.prisma.project.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { memoryLinks: true },
        },
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async searchImages(userId: string, query: string, limit: number) {
    return this.prisma.image.findMany({
      where: {
        userId,
        contentType: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        storageUrl: true,
        thumbnailUrl256: true,
        contentType: true,
        capturedAt: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { capturedAt: 'desc' },
    });
  }

  async searchUrlPages(userId: string, query: string, limit: number) {
    return this.prisma.urlPage.findMany({
      where: {
        userId,
        OR: [
          { url: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
          { siteName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        url: true,
        title: true,
        description: true,
        siteName: true,
        imageUrl: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchYouTubeVideos(query: string, limit: number) {
    return this.prisma.youTubeVideo.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { creatorDisplayName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { transcriptText: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        youtubeVideoId: true,
        title: true,
        creatorDisplayName: true,
        thumbnailUrl: true,
        publishedAt: true,
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
    });
  }

  async searchTikTokVideos(query: string, limit: number) {
    return this.prisma.tikTokVideo.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { creatorDisplayName: { contains: query, mode: 'insensitive' } },
          { creatorUsername: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { transcript: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        tiktokVideoId: true,
        title: true,
        creatorDisplayName: true,
        thumbnailUrl: true,
        publishedAt: true,
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
    });
  }

  async searchPeople(query: string, limit: number) {
    return this.prisma.person.findMany({
      where: {
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { displayName: 'asc' },
    });
  }

  async searchLocations(query: string, limit: number) {
    return this.prisma.location.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
          { country: { contains: query, mode: 'insensitive' } },
          { placeType: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async searchAll(
    userId: string,
    query: string,
    limit: number = 5,
  ): Promise<UnifiedSearchResult> {
    // Execute all searches in parallel
    const [
      memoriesResult,
      projects,
      images,
      urlPages,
      youtubeVideos,
      tiktokVideos,
      people,
      locations,
    ] = await Promise.all([
      this.searchMemories(userId, query, limit),
      this.searchProjects(userId, query, limit),
      this.searchImages(userId, query, limit),
      this.searchUrlPages(userId, query, limit),
      this.searchYouTubeVideos(query, limit),
      this.searchTikTokVideos(query, limit),
      this.searchPeople(query, limit),
      this.searchLocations(query, limit),
    ]);

    return {
      query,
      memories: {
        results: memoriesResult.memories,
        count: memoriesResult.totalCount,
        method: memoriesResult.method,
        degraded: memoriesResult.degraded,
      },
      projects: { results: projects, count: projects.length },
      images: { results: images, count: images.length },
      urlPages: { results: urlPages, count: urlPages.length },
      youtubeVideos: { results: youtubeVideos, count: youtubeVideos.length },
      tiktokVideos: { results: tiktokVideos, count: tiktokVideos.length },
      people: { results: people, count: people.length },
      locations: { results: locations, count: locations.length },
      totalResults:
        memoriesResult.totalCount +
        projects.length +
        images.length +
        urlPages.length +
        youtubeVideos.length +
        tiktokVideos.length +
        people.length +
        locations.length,
    };
  }
}
