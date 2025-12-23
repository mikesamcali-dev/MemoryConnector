import { Test, TestingModule } from '@nestjs/testing';
import { MemoriesService } from './memories.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { DuplicateDetectionService } from '../duplicate-detection/duplicate-detection.service';
import { EnrichmentQueueService } from '../enrichment/enrichment-queue.service';

describe('MemoriesService', () => {
  let service: MemoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoriesService,
        {
          provide: PrismaService,
          useValue: {
            memory: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: UsageService,
          useValue: {
            incrementUsage: jest.fn(),
          },
        },
        {
          provide: DuplicateDetectionService,
          useValue: {
            computeContentHash: jest.fn(),
            checkRecentDuplicate: jest.fn(),
          },
        },
        {
          provide: EnrichmentQueueService,
          useValue: {
            enqueueEnrichment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MemoriesService>(MemoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

