import { Controller, Get, Post, Body, UseGuards, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { UsageLimitGuard } from '../usage/guards/usage-limit.guard';
import { UsageResource } from '../usage/decorators/usage-resource.decorator';
import { MemoriesService } from './memories.service';
import { CreateMemoryDto } from './dto/create-memory.dto';

@ApiTags('memories')
@Controller('memories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MemoriesController {
  constructor(private memoriesService: MemoriesService) {}

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

  @Get()
  @ApiOperation({ summary: 'Get user memories' })
  async findAll(
    @User() user: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.memoriesService.findAll(
      user.id,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific memory' })
  async findOne(@Param('id') id: string, @User() user: any) {
    return this.memoriesService.findOne(user.id, id);
  }
}

