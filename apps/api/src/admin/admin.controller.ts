import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CircuitBreakerService } from '../ai-circuit-breaker/circuit-breaker.service';
import { EnrichmentWorker } from '../enrichment/enrichment.worker';
import { EnrichmentQueueService } from '../enrichment/enrichment-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { WordsService } from '../words/words.service';
import { EventsService } from '../events/events.service';
import { LocationsService } from '../locations/locations.service';
import { UserMemoryService } from '../modules/user-memory/user-memory.service';
import { CreateMemoryTypeDto } from './dto/create-memory-type.dto';
import { UpdateMemoryTypeDto } from './dto/update-memory-type.dto';
import { MemoryState } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(
    private circuitBreaker: CircuitBreakerService,
    private enrichmentWorker: EnrichmentWorker,
    private enrichmentQueue: EnrichmentQueueService,
    private prisma: PrismaService,
    private wordsService: WordsService,
    private eventsService: EventsService,
    private locationsService: LocationsService,
    private userMemoryService: UserMemoryService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin statistics' })
  async getStats() {
    // Get overall system stats
    const userCount = await this.prisma.user.count();
    const memoryCount = await this.prisma.memory.count();
    const embeddingCount = await this.prisma.embedding.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const memoriesToday = await this.prisma.memory.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    return {
      users: userCount,
      memories: memoryCount,
      memoriesToday,
      embeddings: embeddingCount,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ai-cost-tracking')
  @ApiOperation({ summary: 'Get AI cost tracking summary' })
  async getAICostTracking() {
    const dailySpend = await this.circuitBreaker.getDailySpendSummary();

    // Get cost breakdown by operation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCosts = await this.prisma.aiCostTracking.groupBy({
      by: ['operation'],
      where: {
        date: {
          gte: today,
        },
      },
      _sum: {
        tokensUsed: true,
        costCents: true,
      },
      _count: {
        operation: true,
      },
    });

    // Get recent operations
    const recentOperations = await this.prisma.aiCostTracking.findMany({
      take: 20,
      orderBy: {
        date: 'desc',
      },
      select: {
        id: true,
        userId: true,
        operation: true,
        tokensUsed: true,
        costCents: true,
        model: true,
        memoryId: true,
        date: true,
      },
    });

    return {
      dailySpend: {
        totalCents: dailySpend.totalCents,
        percentUsed: dailySpend.percentUsed,
        operationCount: dailySpend.operationCount,
        circuitState: dailySpend.circuitState,
      },
      todayCostsByOperation: todayCosts.map((cost) => ({
        operation: cost.operation,
        count: cost._count.operation,
        totalTokens: Number(cost._sum.tokensUsed || 0),
        totalCents: parseFloat(cost._sum.costCents?.toString() || '0'),
      })),
      recentOperations: recentOperations.map((op) => ({
        ...op,
        costCents: parseFloat(op.costCents.toString()),
      })),
    };
  }

  @Get('circuit-breaker')
  @ApiOperation({ summary: 'Get circuit breaker status' })
  async getCircuitBreakerStatus() {
    const dailySpend = await this.circuitBreaker.getDailySpendSummary();

    return {
      state: dailySpend.circuitState,
      dailySpendCents: dailySpend.totalCents,
      percentUsed: dailySpend.percentUsed,
      operationCount: dailySpend.operationCount,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('enrichment-worker')
  @ApiOperation({ summary: 'Get enrichment worker status' })
  async getEnrichmentWorkerStatus() {
    const status = this.enrichmentWorker.getStatus();

    // Get queue stats from database
    const pendingCount = await this.prisma.memory.count({
      where: {
        enrichmentStatus: {
          in: ['pending', 'queued_budget'],
        },
      },
    });

    const processingCount = await this.prisma.memory.count({
      where: {
        enrichmentStatus: 'processing',
      },
    });

    const completedToday = await this.prisma.memory.count({
      where: {
        enrichmentStatus: 'completed',
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const failedToday = await this.prisma.memory.count({
      where: {
        enrichmentStatus: 'failed',
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return {
      worker: status,
      queue: {
        pending: pendingCount,
        processing: processingCount,
        completedToday,
        failedToday,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('enrichment-worker/trigger')
  @ApiOperation({ summary: 'Manually trigger enrichment queue processing' })
  async triggerEnrichmentProcessing() {
    try {
      await this.enrichmentWorker.triggerProcessing();
      return {
        success: true,
        message: 'Enrichment processing triggered',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('memory-types')
  @ApiOperation({ summary: 'Get all memory types' })
  async getMemoryTypes() {
    return this.prisma.memoryType.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { label: 'asc' },
      ],
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });
  }

  @Post('memory-types')
  @ApiOperation({ summary: 'Create a new memory type' })
  async createMemoryType(@Body() dto: CreateMemoryTypeDto) {
    // Check if code or label already exists
    const existing = await this.prisma.memoryType.findFirst({
      where: {
        OR: [
          { code: dto.code },
          { label: dto.label },
        ],
      },
    });

    if (existing) {
      throw new HttpException(
        'Memory type with this label or code already exists',
        HttpStatus.CONFLICT
      );
    }

    return this.prisma.memoryType.create({
      data: dto,
    });
  }

  @Put('memory-types/:id')
  @ApiOperation({ summary: 'Update a memory type' })
  async updateMemoryType(
    @Param('id') id: string,
    @Body() dto: UpdateMemoryTypeDto
  ) {
    // Check if memory type exists
    const existing = await this.prisma.memoryType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new HttpException('Memory type not found', HttpStatus.NOT_FOUND);
    }

    // Check for conflicts if updating label or code
    if (dto.label || dto.code) {
      const conflict = await this.prisma.memoryType.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                dto.label ? { label: dto.label } : undefined,
                dto.code ? { code: dto.code } : undefined,
              ].filter(Boolean),
            },
          ],
        },
      });

      if (conflict) {
        throw new HttpException(
          'Memory type with this label or code already exists',
          HttpStatus.CONFLICT
        );
      }
    }

    return this.prisma.memoryType.update({
      where: { id },
      data: dto,
    });
  }

  @Delete('memory-types/:id')
  @ApiOperation({ summary: 'Soft delete a memory type by setting enabled to false' })
  async deleteMemoryType(@Param('id') id: string) {
    const existing = await this.prisma.memoryType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

    if (!existing) {
      throw new HttpException('Memory type not found', HttpStatus.NOT_FOUND);
    }

    // Soft delete by setting enabled to false
    return this.prisma.memoryType.update({
      where: { id },
      data: { enabled: false },
    });
  }

  // Word Management Endpoints

  @Get('words')
  @ApiOperation({ summary: 'Get all words' })
  async getAllWords() {
    return this.wordsService.findAll();
  }

  @Post('words')
  @ApiOperation({ summary: 'Create a new word (will auto-enrich with OpenAI)' })
  async createWord(@Body() body: { word: string }) {
    const result = await this.wordsService.createOrFind(body.word);
    return result.word;
  }

  @Get('words/:id')
  @ApiOperation({ summary: 'Get word by ID' })
  async getWord(@Param('id') id: string) {
    return this.wordsService.findById(id);
  }

  @Put('words/:id')
  @ApiOperation({ summary: 'Update word details manually' })
  async updateWord(@Param('id') id: string, @Body() body: any) {
    return this.wordsService.updateWord(id, body);
  }

  @Post('words/:id/enrich')
  @ApiOperation({ summary: 'Re-enrich word with OpenAI (updates for all users)' })
  async enrichWord(@Param('id') id: string) {
    return this.wordsService.enrichWord(id);
  }

  @Delete('words/:id')
  @ApiOperation({ summary: 'Delete a word' })
  async deleteWord(@Param('id') id: string) {
    return this.wordsService.deleteWord(id);
  }

  // Deduplication no longer needed - words have unique constraint
  // @Post('words/deduplicate')
  // @ApiOperation({ summary: 'Remove duplicate words, keeping oldest entry for each unique word' })
  // async deduplicateWords() {
  //   return this.wordsService.deduplicateWords();
  // }

  // Event Management Endpoints

  @Get('events')
  @ApiOperation({ summary: 'Get all events' })
  async getAllEvents() {
    return this.eventsService.findAll();
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get event by ID' })
  async getEvent(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @Post('events/:id/enrich')
  @ApiOperation({ summary: 'Re-enrich event with OpenAI (updates for all users)' })
  async enrichEvent(@Param('id') id: string) {
    return this.eventsService.enrichEvent(id);
  }

  // Location Management Endpoints

  @Get('locations')
  @ApiOperation({ summary: 'Get all locations' })
  async getAllLocations() {
    return this.locationsService.findAll();
  }

  @Get('locations/:id')
  @ApiOperation({ summary: 'Get location by ID' })
  async getLocation(@Param('id') id: string) {
    return this.locationsService.findById(id);
  }

  @Post('locations/:id/enrich')
  @ApiOperation({ summary: 'Re-enrich location with OpenAI (updates for all users)' })
  async enrichLocation(@Param('id') id: string) {
    return this.locationsService.enrichLocation(id);
  }

  @Post('locations/preview-enrich')
  @ApiOperation({ summary: 'Preview location enrichment without creating (OpenAI)' })
  async previewLocationEnrichment(@Body() body: { address: string }) {
    return this.locationsService.previewEnrichment(body.address);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with memory counts' })
  async getAllUsers() {
    console.log('GET /admin/users called');
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        tier: true,
        roles: true,
        provider: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            memories: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found users:', users.length);
    const result = users.map(user => ({
      id: user.id,
      email: user.email,
      tier: user.tier,
      roles: user.roles,
      provider: user.provider,
      isEnabled: user.isEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      memoryCount: user._count.memories,
    }));
    console.log('Returning users:', result);
    return result;
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        tier: true,
        roles: true,
        provider: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            memories: true,
          },
        },
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      ...user,
      memoryCount: user._count.memories,
    };
  }

  @Put('users/:id/roles')
  @ApiOperation({ summary: 'Update user roles' })
  async updateUserRoles(
    @Param('id') id: string,
    @Body() body: { roles: string[] }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.user.update({
      where: { id },
      data: { roles: body.roles },
    });
  }

  @Put('users/:id/tier')
  @ApiOperation({ summary: 'Update user tier' })
  async updateUserTier(
    @Param('id') id: string,
    @Body() body: { tier: 'free' | 'premium' }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.user.update({
      where: { id },
      data: { tier: body.tier },
    });
  }

  @Put('users/:id/enabled')
  @ApiOperation({ summary: 'Enable or disable a user' })
  async updateUserEnabled(
    @Param('id') id: string,
    @Body() body: { isEnabled: boolean }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.user.update({
      where: { id },
      data: { isEnabled: body.isEnabled },
      select: {
        id: true,
        email: true,
        isEnabled: true,
        tier: true,
        roles: true,
      },
    });
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user and all associated data' })
  async deleteUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            memories: true,
          },
        },
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Delete user (cascade will handle memories and related data)
    await this.prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      message: `User ${user.email} and ${user._count.memories} memories deleted`,
      deletedUser: {
        id: user.id,
        email: user.email,
        memoriesDeleted: user._count.memories,
      },
    };
  }

  @Post('users/:id/reset-onboarding')
  @ApiOperation({ summary: 'Reset user onboarding to prompt them to update their memory profile' })
  async resetUserOnboarding(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check if user has a profile
    const profile = await this.prisma.userMemoryProfile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      // User hasn't completed onboarding yet - they're already in the state
      // where they'll be prompted on next login
      return {
        success: true,
        message: `User ${user.email} has not completed onboarding. They will be prompted to complete their profile on next login.`,
        user: {
          id: user.id,
          email: user.email,
        },
        profile: null,
      };
    }

    // Reset onboarding status while preserving existing profile data
    const updatedProfile = await this.prisma.userMemoryProfile.update({
      where: { userId: id },
      data: {
        onboardingCompleted: false,
        // Don't delete the profile data - just mark as needing re-onboarding
        // This allows the user to see their previous answers when re-onboarding
      },
    });

    return {
      success: true,
      message: `Onboarding reset for user ${user.email}. They will be prompted to update their profile on next login.`,
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        onboardingCompleted: updatedProfile.onboardingCompleted,
        learningStyle: updatedProfile.learningStyle,
        skillLevel: updatedProfile.skillLevel,
        primaryGoal: updatedProfile.primaryGoal,
      },
    };
  }

  @Get('memories-by-user')
  @ApiOperation({ summary: 'Get all memories grouped by user' })
  async getAllMemoriesByUser() {
    const users = await this.prisma.user.findMany({
      include: {
        memories: {
          select: {
            id: true,
            title: true,
            body: true,
            state: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users
      .filter(user => user.memories.length > 0)
      .map(user => ({
        userId: user.id,
        email: user.email,
        memories: user.memories,
      }));
  }

  @Get('failed-jobs')
  @ApiOperation({ summary: 'Get failed enrichment jobs from today' })
  async getFailedJobs() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get failed memories (those that are still in SAVED state for a long time, indicating enrichment failed)
    const failedMemories = await this.prisma.memory.findMany({
      where: {
        state: MemoryState.SAVED,
        createdAt: {
          gte: today,
          lte: new Date(Date.now() - 60 * 60 * 1000), // Older than 1 hour
        },
        enrichmentStatus: {
          in: ['failed', 'pending'],
        },
      },
      select: {
        id: true,
        title: true,
        body: true,
        state: true,
        enrichmentStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return failedMemories.map(memory => ({
      memoryId: memory.id,
      title: memory.title,
      body: memory.body,
      state: memory.state,
      failedAt: memory.updatedAt,
      error: `Enrichment ${memory.enrichmentStatus || 'pending'} - Memory stuck in ${memory.state} state for over 1 hour`,
      attemptsMade: 0,
      maxRetries: 3,
    }));
  }

  @Get('extraction-data')
  @ApiOperation({ summary: 'Get LLM extraction data for all memories' })
  async getExtractionData() {
    const memories = await this.prisma.memory.findMany({
      where: {
        enrichmentStatus: 'completed',
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        person: true,
        location: true,
        event: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to recent 100
    });

    return memories.map(memory => ({
      id: memory.id,
      userEmail: memory.user.email,
      title: memory.title,
      body: memory.body?.substring(0, 100) + (memory.body && memory.body.length > 100 ? '...' : ''),
      enrichmentStatus: memory.enrichmentStatus,
      createdAt: memory.createdAt,

      // Extraction data
      hasExtraction: !!memory.data?.['extraction'],
      extractionData: memory.data?.['extraction'] || null,

      // Linked entities
      linkedPerson: memory.person ? {
        id: memory.person.id,
        displayName: memory.person.displayName,
        email: memory.person.email,
      } : null,

      linkedLocation: memory.location ? {
        id: memory.location.id,
        name: memory.location.name,
        address: memory.location.address,
        city: memory.location.city,
      } : null,

      linkedEvent: memory.event ? {
        startAt: memory.event.startAt,
        endAt: memory.event.endAt,
        description: memory.event.description,
      } : null,

      // Summary counts (based on actual linked entities and extraction data)
      extractionSummary: {
        personCount: memory.person ? 1 : (memory.data?.['extraction']?.persons?.length || 0),
        eventCount: memory.event ? 1 : (memory.data?.['extraction']?.events?.length || 0),
        locationCount: memory.location ? 1 : (memory.data?.['extraction']?.locations?.length || 0),
        followUpCount: memory.data?.['extraction']?.follow_up_actions?.length || 0,
      },
    }));
  }

  @Get('enrichment-failures')
  @ApiOperation({ summary: 'Get all failed/pending enrichment memories with detailed logs' })
  async getEnrichmentFailures() {
    // Get all failed and pending memories (not limited to today)
    const memories = await this.prisma.memory.findMany({
      where: {
        enrichmentStatus: {
          in: ['failed', 'pending'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: [
        { enrichmentStatus: 'desc' }, // failed first, then pending
        { createdAt: 'desc' },
      ],
      take: 100,
    });

    return memories.map(memory => ({
      id: memory.id,
      userId: memory.user.id,
      userEmail: memory.user.email,
      title: memory.title,
      body: memory.body?.substring(0, 200) + (memory.body && memory.body.length > 200 ? '...' : ''),
      fullBody: memory.body,
      enrichmentStatus: memory.enrichmentStatus,
      state: memory.state,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
      enrichmentQueuedAt: memory.enrichmentQueuedAt,
      timeSinceCreation: Date.now() - new Date(memory.createdAt).getTime(),
      timeSinceUpdate: Date.now() - new Date(memory.updatedAt).getTime(),
      logs: {
        created: `Memory created at ${memory.createdAt.toISOString()}`,
        updated: `Last updated at ${memory.updatedAt.toISOString()}`,
        queued: memory.enrichmentQueuedAt
          ? `Queued for enrichment at ${memory.enrichmentQueuedAt.toISOString()}`
          : 'Never queued for enrichment',
        status: `Current status: ${memory.enrichmentStatus}`,
        diagnosis: this.diagnoseEnrichmentFailure(memory),
      },
    }));
  }

  @Post('enrichment-failures/:id/retry')
  @ApiOperation({ summary: 'Retry enrichment for a specific failed/pending memory' })
  async retryEnrichment(@Param('id') memoryId: string) {
    const memory = await this.prisma.memory.findUnique({
      where: { id: memoryId },
      select: {
        id: true,
        userId: true,
        enrichmentStatus: true,
        title: true,
      },
    });

    if (!memory) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    if (!['failed', 'pending'].includes(memory.enrichmentStatus)) {
      throw new HttpException(
        'Memory is not in failed or pending state',
        HttpStatus.BAD_REQUEST
      );
    }

    // Re-queue the memory for enrichment
    const result = await this.enrichmentQueue.enqueueEnrichment(
      memory.id,
      memory.userId
    );

    // Update the status to pending if it was failed
    if (memory.enrichmentStatus === 'failed') {
      await this.prisma.memory.update({
        where: { id: memoryId },
        data: { enrichmentStatus: 'pending' },
      });
    }

    return {
      success: true,
      memoryId: memory.id,
      title: memory.title,
      queued: result.queued,
      reason: result.reason,
      message: result.queued
        ? 'Memory successfully re-queued for enrichment'
        : `Memory not queued: ${result.reason}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('enrichment-failures/retry-all')
  @ApiOperation({ summary: 'Retry enrichment for all failed/pending memories' })
  async retryAllFailedEnrichments() {
    const memories = await this.prisma.memory.findMany({
      where: {
        enrichmentStatus: {
          in: ['failed', 'pending'],
        },
      },
      select: {
        id: true,
        userId: true,
        enrichmentStatus: true,
        title: true,
      },
      take: 50, // Limit to 50 to avoid overwhelming the system
    });

    const results = {
      total: memories.length,
      queued: 0,
      failed: 0,
      details: [] as any[],
    };

    for (const memory of memories) {
      try {
        const result = await this.enrichmentQueue.enqueueEnrichment(
          memory.id,
          memory.userId
        );

        // Update status to pending if it was failed
        if (memory.enrichmentStatus === 'failed') {
          await this.prisma.memory.update({
            where: { id: memory.id },
            data: { enrichmentStatus: 'pending' },
          });
        }

        if (result.queued) {
          results.queued++;
        } else {
          results.failed++;
        }

        results.details.push({
          memoryId: memory.id,
          title: memory.title,
          queued: result.queued,
          reason: result.reason,
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          memoryId: memory.id,
          title: memory.title,
          queued: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      summary: `Re-queued ${results.queued} of ${results.total} memories`,
      ...results,
      timestamp: new Date().toISOString(),
    };
  }

  private diagnoseEnrichmentFailure(memory: any): string {
    const timeSinceCreation = Date.now() - new Date(memory.createdAt).getTime();
    const hoursSinceCreation = timeSinceCreation / (1000 * 60 * 60);

    if (memory.enrichmentStatus === 'failed') {
      if (!memory.enrichmentQueuedAt) {
        return 'DIAGNOSIS: Memory was never queued for enrichment. Likely Redis was down when memory was created.';
      }
      return 'DIAGNOSIS: Enrichment job failed during processing. Possible causes: AI API error, network issue, or processing timeout.';
    }

    if (memory.enrichmentStatus === 'pending') {
      if (!memory.enrichmentQueuedAt) {
        return 'DIAGNOSIS: Memory created but never queued. Likely Redis was unavailable or enrichment queue service failed.';
      }
      if (hoursSinceCreation > 1) {
        return `DIAGNOSIS: Memory queued ${hoursSinceCreation.toFixed(1)} hours ago but still pending. Enrichment worker may not be running or queue is stuck.`;
      }
      return 'DIAGNOSIS: Recently created, waiting for enrichment worker to process.';
    }

    return 'DIAGNOSIS: Status unclear.';
  }
}

