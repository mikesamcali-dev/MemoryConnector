import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { DuplicateDetectionService } from '../duplicate-detection/duplicate-detection.service';
import { EnrichmentQueueService } from '../enrichment/enrichment-queue.service';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { MemoryState } from '@prisma/client';

@Injectable()
export class MemoriesService {
  constructor(
    private prisma: PrismaService,
    private usageService: UsageService,
    private duplicateDetection: DuplicateDetectionService,
    private enrichmentQueue: EnrichmentQueueService
  ) {}

  async create(userId: string, createMemoryDto: CreateMemoryDto) {
    const { textContent, imageUrl, type } = createMemoryDto;

    // Check for content-based duplicate
    const contentHash = this.duplicateDetection.computeContentHash(
      textContent || '',
      imageUrl
    );
    const { isDuplicate, existingMemoryId } = await this.duplicateDetection.checkRecentDuplicate(
      userId,
      contentHash
    );

    if (isDuplicate) {
      throw new HttpException(
        {
          error: 'DUPLICATE_CONTENT',
          message: 'This memory was already saved in the last minute',
          existingMemoryId,
        },
        HttpStatus.CONFLICT
      );
    }

    // Create the memory
    const memory = await this.prisma.memory.create({
      data: {
        userId,
        textContent: textContent || null,
        imageUrl: imageUrl || null,
        type: type || null,
        contentHash,
        state: MemoryState.SAVED,
        enrichmentStatus: 'pending',
      },
    });

    // Increment usage
    await this.usageService.incrementUsage(userId, 'memories');

    // Queue for enrichment (handles circuit breaker internally)
    const { queued } = await this.enrichmentQueue.enqueueEnrichment(memory.id, userId);

    return {
      ...memory,
      enrichmentQueued: queued,
    };
  }

  async findAll(userId: string, skip: number = 0, take: number = 20) {
    return this.prisma.memory.findMany({
      where: {
        userId,
        state: {
          not: MemoryState.DELETED,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  async findOne(userId: string, id: string) {
    const memory = await this.prisma.memory.findFirst({
      where: {
        id,
        userId,
        state: {
          not: MemoryState.DELETED,
        },
      },
    });

    if (!memory) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    return memory;
  }
}
