import { Controller, Get, Post, Put, Delete, Body, UseGuards, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { UsageLimitGuard } from '../usage/guards/usage-limit.guard';
import { UsageResource } from '../usage/decorators/usage-resource.decorator';
import { MemoriesService } from './memories.service';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { UpdateMemoryDto } from './dto/update-memory.dto';
import { AnalyzeTextDto } from './dto/analyze-text.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LLMExtractionService } from '../enrichment/llm-extraction.service';
import { SpellCheckService } from '../spell-check/spell-check.service';

@ApiTags('memories')
@Controller('memories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MemoriesController {
  constructor(
    private memoriesService: MemoriesService,
    private prisma: PrismaService,
    private llmExtractionService: LLMExtractionService,
    private spellCheckService: SpellCheckService,
  ) {}

  @Post()
  @UseGuards(UsageLimitGuard)
  @UsageResource('memories')
  @ApiOperation({ summary: 'Create a new memory' })
  @ApiResponse({ status: 201, description: 'Memory created successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate content or idempotency conflict' })
  @ApiResponse({ status: 429, description: 'Usage limit exceeded' })
  async create(@Body() createMemoryDto: CreateMemoryDto, @User() user: any) {
    const memory = await this.memoriesService.create(user.id, createMemoryDto);
    return {
      ...memory,
      enrichmentQueued: memory.enrichmentStatus === 'queued_budget',
      enrichmentNote:
        memory.enrichmentStatus === 'queued_budget'
          ? 'Classification will be processed when capacity is available'
          : undefined,
    };
  }

  @Post('with-keyword-expansion')
  @UseGuards(UsageLimitGuard)
  @UsageResource('memories')
  @ApiOperation({ summary: 'Create a new memory with AI keyword expansion for single words' })
  @ApiResponse({ status: 201, description: 'Memory created successfully with expanded keywords' })
  @ApiResponse({ status: 409, description: 'Duplicate content or idempotency conflict' })
  @ApiResponse({ status: 429, description: 'Usage limit exceeded' })
  async createWithKeywordExpansion(
    @Body() createMemoryDto: CreateMemoryDto,
    @Query('addToDeck') addToDeck: string | undefined,
    @User() user: any,
  ) {
    const addToDeckBool = addToDeck === 'true' || addToDeck === '1';
    const result = await this.memoriesService.createWithKeywordExpansion(
      user.id,
      createMemoryDto,
      addToDeckBool,
    );

    return {
      ...result.memory,
      expandedKeywords: result.expandedKeywords,
      enrichmentQueued: result.memory.enrichmentStatus === 'queued_budget',
      enrichmentNote:
        result.memory.enrichmentStatus === 'queued_budget'
          ? 'Classification will be processed when capacity is available'
          : undefined,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user memories' })
  async findAll(
    @User() user: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('filterByType') filterByType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.memoriesService.findAll(
      user.id,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20,
      {
        sortBy: sortBy || 'createdAt',
        sortOrder: (sortOrder === 'asc' || sortOrder === 'desc') ? sortOrder : 'desc',
        filterByType: filterByType || undefined,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      }
    );
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all active memory types' })
  async getMemoryTypes() {
    return this.prisma.memoryType.findMany({
      where: {
        enabled: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { label: 'asc' },
      ],
      select: {
        id: true,
        code: true,
        label: true,
        description: true,
        icon: true,
        color: true,
        sortOrder: true,
        storageStrategy: true,
        tableName: true,
      },
    });
  }

  @Get(':id/extraction')
  @ApiOperation({ summary: 'Get extraction data for a memory (DEBUG)' })
  async getExtraction(@Param('id') id: string, @User() user: any) {
    const memory = await this.prisma.memory.findFirst({
      where: { id, userId: user.id },
      include: {
        person: true,
        location: true,
        event: true,
      },
    });

    if (!memory) {
      return { error: 'Memory not found' };
    }

    return {
      memoryId: memory.id,
      enrichmentStatus: memory.enrichmentStatus,
      extractionData: memory.data,
      linkedPerson: memory.person,
      linkedLocation: memory.location,
      linkedEvent: memory.event,
      hasExtraction: !!memory.data?.['extraction'],
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific memory' })
  async findOne(@Param('id') id: string, @User() user: any) {
    return this.memoriesService.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a memory' })
  @ApiResponse({ status: 200, description: 'Memory updated successfully' })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async update(
    @Param('id') id: string,
    @Body() updateMemoryDto: UpdateMemoryDto,
    @User() user: any
  ) {
    return this.memoriesService.update(user.id, id, updateMemoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a memory (soft delete)' })
  @ApiResponse({ status: 200, description: 'Memory deleted successfully' })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async delete(@Param('id') id: string, @User() user: any) {
    await this.memoriesService.delete(user.id, id);
    return { message: 'Memory deleted successfully' };
  }

  @Post(':id/link-words')
  @ApiOperation({ summary: 'Link words to a memory' })
  @ApiResponse({ status: 200, description: 'Words linked successfully' })
  async linkWords(
    @Param('id') memoryId: string,
    @Body() body: { words: string[] },
    @User() user: any
  ) {
    return this.memoriesService.linkWordsToMemory(user.id, memoryId, body.words);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze text for entities and spelling errors before creating a memory' })
  @ApiResponse({ status: 200, description: 'Text analyzed successfully' })
  async analyzeText(@Body() analyzeTextDto: AnalyzeTextDto, @User() user: any) {
    const { text } = analyzeTextDto;

    // Extract entities using LLM
    const extraction = await this.llmExtractionService.extractEntities(text);

    // Get spell check suggestions
    const spellingSuggestions = await this.spellCheckService.checkText(text, user.id);

    // Find matching persons in database (fuzzy matching)
    const potentialPersons = extraction.persons || [];
    const matchedPersons = await Promise.all(
      potentialPersons.map(async (personEntity) => {
        const personName = personEntity.canonical_name;

        // Search for similar person names in the database
        const existing = await this.prisma.person.findMany({
          where: {
            OR: [
              { displayName: { contains: personName, mode: 'insensitive' } },
              { displayName: { startsWith: personName, mode: 'insensitive' } },
            ],
          },
          take: 5,
        });

        return {
          extractedName: personName,
          existingMatches: existing.map(p => ({
            id: p.id,
            displayName: p.displayName,
            email: p.email,
          })),
          isNewPerson: existing.length === 0,
        };
      })
    );

    // Find matching locations
    const potentialLocations = extraction.locations || [];
    const matchedLocations = await Promise.all(
      potentialLocations.map(async (locationEntity) => {
        const locationName = locationEntity.name;

        const existing = await this.prisma.location.findMany({
          where: {
            name: { contains: locationName, mode: 'insensitive' },
          },
          take: 5,
        });

        return {
          extractedName: locationName,
          existingMatches: existing.map(l => ({
            id: l.id,
            name: l.name,
            city: l.city,
            address: l.address,
          })),
          isNewLocation: existing.length === 0,
        };
      })
    );

    // Detect YouTube URLs in text
    const youtubeUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    const youtubeMatches = [...text.matchAll(youtubeUrlRegex)];
    const youtubeUrls = youtubeMatches.map(match => ({
      url: match[0],
      videoId: match[1],
    }));

    // Check if YouTube videos already exist
    const matchedYouTubeVideos = await Promise.all(
      youtubeUrls.map(async (youtube) => {
        const existing = await this.prisma.youTubeVideo.findUnique({
          where: {
            platform_youtubeVideoId: {
              platform: 'youtube',
              youtubeVideoId: youtube.videoId,
            },
          },
        });

        return {
          url: youtube.url,
          videoId: youtube.videoId,
          existingVideo: existing ? {
            id: existing.id,
            title: existing.title,
            creatorDisplayName: existing.creatorDisplayName,
            thumbnailUrl: existing.thumbnailUrl,
          } : null,
          isNewVideo: !existing,
        };
      })
    );

    // Process words: filter excluded words and check if they exist in database
    const extractedWords = extraction.words || [];

    // Get user's excluded words
    const excludedWords = await this.prisma.excludedWord.findMany({
      where: { userId: user.id },
      select: { word: true },
    });
    const excludedWordSet = new Set(excludedWords.map(w => w.word.toLowerCase()));

    // Filter out excluded words and common stop words
    const commonStopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'as', 'by', 'with', 'from', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);

    const filteredWords = extractedWords.filter(word => {
      const wordLower = word.toLowerCase().trim();
      return !excludedWordSet.has(wordLower) && !commonStopWords.has(wordLower);
    });

    // Check if words exist in database
    const matchedWords = await Promise.all(
      filteredWords.map(async (word) => {
        const wordLower = word.toLowerCase().trim();

        // Search for existing word in database (standalone)
        const existing = await this.prisma.word.findUnique({
          where: {
            word: wordLower,
          },
          include: {
            _count: {
              select: {
                memoryLinks: true,
              },
            },
          },
        });

        return {
          word: word,
          existingWord: existing ? {
            id: existing.id,
            word: existing.word,
            description: existing.description,
            partOfSpeech: existing.partOfSpeech,
            memoryCount: existing._count.memoryLinks,
          } : null,
          isNewWord: !existing,
        };
      })
    );

    return {
      persons: matchedPersons,
      locations: matchedLocations,
      youtubeVideos: matchedYouTubeVideos,
      words: matchedWords,
      spellingErrors: spellingSuggestions.filter(s => !s.isCorrect),
      extractionSummary: extraction.summaries || [],
    };
  }
}

