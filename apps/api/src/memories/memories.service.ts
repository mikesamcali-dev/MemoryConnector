import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { DuplicateDetectionService } from '../duplicate-detection/duplicate-detection.service';
import { EnrichmentQueueService } from '../enrichment/enrichment-queue.service';
import { GamificationService } from '../gamification/gamification.service';
import { WordsService } from '../words/words.service';
import { EventsService } from '../events/events.service';
import { LocationsService } from '../locations/locations.service';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { UpdateMemoryDto } from './dto/update-memory.dto';
import { MemoryState, StorageStrategy } from '@prisma/client';

@Injectable()
export class MemoriesService {
  constructor(
    private prisma: PrismaService,
    private usageService: UsageService,
    private duplicateDetection: DuplicateDetectionService,
    private enrichmentQueue: EnrichmentQueueService,
    private gamificationService: GamificationService,
    private wordsService: WordsService,
    private eventsService: EventsService,
    private locationsService: LocationsService,
    private userPreferencesService: UserPreferencesService,
  ) {}

  async create(userId: string, createMemoryDto: CreateMemoryDto) {
    const { textContent, imageUrl, typeId, latitude, longitude, locationId, personId, youtubeVideoId, tiktokVideoId, twitterPostId, createReminder } = createMemoryDto;

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

    // Get memory type information if provided
    let memoryType = null;
    if (typeId) {
      memoryType = await this.prisma.memoryType.findUnique({
        where: { id: typeId },
      });
    }

    // Create the memory
    let memory = await this.prisma.memory.create({
      data: {
        userId,
        title: null,
        body: textContent || null,
        imageUrl: imageUrl || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        locationId: locationId ?? null,
        personId: personId ?? null,
        youtubeVideoId: youtubeVideoId ?? null,
        tiktokVideoId: tiktokVideoId ?? null,
        twitterPostId: twitterPostId ?? null,
        occurredAt: new Date(),
        contentHash,
        state: MemoryState.SAVED,
        enrichmentStatus: 'pending',
      },
    });

    // Create type assignment if type was provided
    if (typeId && memoryType) {
      await this.prisma.memoryTypeAssignment.create({
        data: {
          memoryId: memory.id,
          memoryTypeId: typeId,
          confidence: 1.0,
        },
      });

      // Handle structured types
      if (memoryType.storageStrategy === StorageStrategy.structured) {
        await this.createStructuredTypeData(memory, memoryType, textContent || '');
      }

      // Reload memory with type assignments
      memory = await this.prisma.memory.findUnique({
        where: { id: memory.id },
        include: {
          typeAssignments: {
            include: {
              memoryType: true,
            },
          },
          event: true,
          location: true,
          person: true,
          youtubeVideo: true,
          tiktokVideo: true,
          wordLinks: {
            include: {
              word: true,
            },
          },
        },
      });
    }

    // Increment usage
    await this.usageService.incrementUsage(userId, 'memories');

    // Create reminders only if explicitly requested
    if (createMemoryDto.createReminder) {
      const prefs = await this.userPreferencesService.getReminderPreferences(userId);

      if (prefs.remindersEnabled) {
        console.log('Creating reminders for memory:', memory.id);
        const now = new Date();

        const reminderTimes = [
          new Date(now.getTime() + prefs.firstReminderMinutes * 60 * 1000),
          new Date(now.getTime() + prefs.secondReminderMinutes * 60 * 1000),
          new Date(now.getTime() + prefs.thirdReminderMinutes * 60 * 1000),
        ];

        const createdReminders = await Promise.all(
          reminderTimes.map((scheduledAt) =>
            this.prisma.reminder.create({
              data: {
                userId,
                memoryId: memory.id,
                scheduledAt,
                status: 'pending',
              },
            })
          )
        );

        console.log(`Created ${createdReminders.length} reminders for memory`);
      }
    }

    // Queue for enrichment (handles circuit breaker internally)
    const { queued } = await this.enrichmentQueue.enqueueEnrichment(memory.id, userId);

    // Update gamification stats (streak, achievements)
    const newAchievements = await this.gamificationService.updateCaptureStreak(userId);

    return {
      ...this.transformMemoryResponse(memory),
      enrichmentQueued: queued,
      newAchievements: newAchievements.map(a => ({ id: a.id, name: a.name, icon: a.icon })),
    };
  }

  /**
   * Create structured type data for memories with structured storage strategy
   */
  private async createStructuredTypeData(memory: any, memoryType: any, textContent: string) {
    const { tableName, code } = memoryType;

    if (!tableName) {
      return;
    }

    try {
      switch (tableName) {
        case 'words':
          // Words are now standalone entities - should be created and linked via linkWordsToMemory
          console.log('Word type detected - use "Find Words" feature to link words to memories');
          break;

        case 'events':
          console.log('Creating event entry for memory:', memory.id);
          await this.eventsService.createForMemory(memory.id, textContent);
          break;

        case 'locations':
          console.log('Creating location entry for memory:', memory.id);
          await this.locationsService.createOrLinkLocation(memory.id, textContent, memory.latitude, memory.longitude);
          break;

        case 'people':
          // Person is now a shared entity - should be created separately via Person Builder
          // and linked to memories via personId field
          console.log('Person type detected - use Person Builder to create and link people');
          break;

        default:
          console.log('Unknown structured type:', tableName);
      }
    } catch (error) {
      console.error(`Error creating structured data for ${tableName}:`, error);
      // Don't throw - structured data creation is optional
    }
  }

  async findAll(userId: string, skip: number = 0, take: number = 20) {
    const memories = await this.prisma.memory.findMany({
      where: {
        userId,
        state: {
          not: MemoryState.DELETED,
        },
      },
      include: {
        typeAssignments: {
          include: {
            memoryType: true,
          },
        },
        imageLinks: {
          include: {
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    return memories.map(memory => this.transformMemoryResponse(memory));
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
      include: {
        typeAssignments: {
          include: {
            memoryType: true,
          },
        },
        event: true,
        location: true,
        person: true,
        youtubeVideo: true,
        tiktokVideo: true,
        twitterPost: true,
        wordLinks: {
          include: {
            word: true,
          },
        },
        imageLinks: {
          include: {
            image: true,
          },
        },
        urlPageLinks: {
          include: {
            urlPage: true,
          },
        },
        questions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        linksFrom: {
          include: {
            target: {
              select: {
                id: true,
                title: true,
                body: true,
                createdAt: true,
                typeAssignments: {
                  include: {
                    memoryType: true,
                  },
                },
              },
            },
          },
        },
        linksTo: {
          include: {
            source: {
              select: {
                id: true,
                title: true,
                body: true,
                createdAt: true,
                typeAssignments: {
                  include: {
                    memoryType: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!memory) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    return this.transformMemoryResponse(memory);
  }

  /**
   * Transform memory response to include textContent field for frontend compatibility
   */
  private transformMemoryResponse(memory: any): any {
    const { title, body, ...rest } = memory;

    return {
      ...rest,
      textContent: body,
      title: null, // Always null - we only use body now
      body,
    };
  }

  async update(userId: string, id: string, updateMemoryDto: UpdateMemoryDto) {
    // First check if memory exists and belongs to user
    const existing = await this.prisma.memory.findFirst({
      where: {
        id,
        userId,
        state: {
          not: MemoryState.DELETED,
        },
      },
    });

    if (!existing) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    // Build update data object
    const updateData: any = {};

    // Handle textContent -> body conversion
    if (updateMemoryDto.textContent !== undefined) {
      updateData.title = null;
      updateData.body = updateMemoryDto.textContent || null;
    }

    if (updateMemoryDto.imageUrl !== undefined) {
      updateData.imageUrl = updateMemoryDto.imageUrl;
    }
    if (updateMemoryDto.latitude !== undefined) {
      updateData.latitude = updateMemoryDto.latitude;
    }
    if (updateMemoryDto.longitude !== undefined) {
      updateData.longitude = updateMemoryDto.longitude;
    }

    // Handle relationship updates
    if (updateMemoryDto.wordId !== undefined) {
      updateData.wordId = updateMemoryDto.wordId;
    }
    if (updateMemoryDto.eventId !== undefined) {
      updateData.eventId = updateMemoryDto.eventId;
    }
    if (updateMemoryDto.locationId !== undefined) {
      updateData.locationId = updateMemoryDto.locationId;
    }
    if (updateMemoryDto.personId !== undefined) {
      updateData.personId = updateMemoryDto.personId;
    }
    if (updateMemoryDto.youtubeVideoId !== undefined) {
      updateData.youtubeVideoId = updateMemoryDto.youtubeVideoId;
    }
    if (updateMemoryDto.tiktokVideoId !== undefined) {
      updateData.tiktokVideoId = updateMemoryDto.tiktokVideoId;
    }
    if (updateMemoryDto.twitterPostId !== undefined) {
      updateData.twitterPostId = updateMemoryDto.twitterPostId;
    }

    // Update the memory
    const memory = await this.prisma.memory.update({
      where: { id },
      data: updateData,
      include: {
        typeAssignments: {
          include: {
            memoryType: true,
          },
        },
        event: true,
        location: true,
        person: true,
        youtubeVideo: true,
        tiktokVideo: true,
        twitterPost: true,
        wordLinks: {
          include: {
            word: true,
          },
        },
      },
    });

    // Handle type assignment updates
    if (updateMemoryDto.typeId !== undefined) {
      // Remove existing type assignments
      await this.prisma.memoryTypeAssignment.deleteMany({
        where: { memoryId: id },
      });

      // Add new type assignment if provided
      if (updateMemoryDto.typeId) {
        await this.prisma.memoryTypeAssignment.create({
          data: {
            memoryId: id,
            memoryTypeId: updateMemoryDto.typeId,
            confidence: 1.0,
          },
        });
      }
    }

    return this.transformMemoryResponse(memory);
  }

  async linkWordsToMemory(userId: string, memoryId: string, words: string[]): Promise<{ linked: string[], created: string[] }> {
    // Verify memory belongs to user
    const memory = await this.prisma.memory.findFirst({
      where: {
        id: memoryId,
        userId,
        state: {
          not: MemoryState.DELETED,
        },
      },
    });

    if (!memory) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    const linked: string[] = [];
    const created: string[] = [];

    for (const wordText of words) {
      const normalizedWord = wordText.toLowerCase().trim();

      // Check if word already exists as a standalone entity
      let word = await this.prisma.word.findUnique({
        where: {
          word: normalizedWord,
        },
      });

      if (word) {
        linked.push(wordText);
      } else {
        // Create new standalone word
        word = await this.prisma.word.create({
          data: {
            word: normalizedWord,
            // Word will be enriched later by background worker
          },
        });
        created.push(wordText);
      }

      // Create link from memory to word (if not exists)
      const existingLink = await this.prisma.memoryWordLink.findUnique({
        where: {
          memoryId_wordId: {
            memoryId: memoryId,
            wordId: word.id,
          },
        },
      });

      if (!existingLink) {
        await this.prisma.memoryWordLink.create({
          data: {
            memoryId: memoryId,
            wordId: word.id,
          },
        });
      }
    }

    return { linked, created };
  }

  async delete(userId: string, id: string) {
    // First check if memory exists and belongs to user
    const existing = await this.prisma.memory.findFirst({
      where: {
        id,
        userId,
        state: {
          not: MemoryState.DELETED,
        },
      },
    });

    if (!existing) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    // Soft delete by setting state to DELETED
    await this.prisma.memory.update({
      where: { id },
      data: {
        state: MemoryState.DELETED,
      },
    });

    // Decrement usage counters (only if created today/this month)
    await this.usageService.decrementUsage(userId, 'memories', existing.createdAt);

    console.log('Memory soft deleted:', id);
  }
}
