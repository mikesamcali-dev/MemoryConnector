import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SamService } from './sam.service';
import { SamRetrievalService } from './sam-retrieval.service';
import { SamTrainingService } from './sam-training.service';
import { SamAuditService } from './sam-audit.service';
import { CreateSamMemoryDto } from './dto/create-sam-memory.dto';
import { RecallSamMemoryDto } from './dto/recall-sam-memory.dto';

@ApiTags('sam')
@Controller('api/v1/sam')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SamController {
  constructor(
    private samService: SamService,
    private retrievalService: SamRetrievalService,
    private trainingService: SamTrainingService,
    private auditService: SamAuditService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new SAM memory' })
  @ApiResponse({ status: 201, description: 'Memory created successfully' })
  async create(@Req() req: any, @Body() dto: CreateSamMemoryDto) {
    const userId = req.user.userId;
    return this.samService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List SAM memories' })
  @ApiResponse({ status: 200, description: 'List of memories' })
  async findAll(
    @Req() req: any,
    @Query('archived') archived?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string
  ) {
    const userId = req.user.userId;
    const filter: any = {};

    if (archived !== undefined) {
      filter.archived = archived === 'true';
    }

    if (tags) {
      filter.tags = tags.split(',');
    }

    if (search) {
      filter.search = search;
    }

    return this.samService.findAll(userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get SAM memory by ID' })
  @ApiResponse({ status: 200, description: 'Memory found' })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.samService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update SAM memory' })
  @ApiResponse({ status: 200, description: 'Memory updated' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateSamMemoryDto>
  ) {
    const userId = req.user.userId;
    return this.samService.update(id, userId, dto);
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archive SAM memory' })
  @ApiResponse({ status: 200, description: 'Memory archived' })
  async archive(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.samService.archive(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete SAM memory' })
  @ApiResponse({ status: 200, description: 'Memory deleted' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.samService.delete(id, userId);
  }

  @Post('recall')
  @ApiOperation({ summary: 'Recall relevant SAM memories' })
  @ApiResponse({ status: 200, description: 'Memories recalled' })
  async recall(@Req() req: any, @Body() dto: RecallSamMemoryDto) {
    const userId = req.user.userId;
    return this.retrievalService.recall(userId, dto);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get audit history for memory' })
  @ApiResponse({ status: 200, description: 'Audit history' })
  async getAudit(@Req() req: any, @Param('id') id: string) {
    return this.auditService.getHistory(id);
  }

  @Post(':id/training/suggest')
  @ApiOperation({ summary: 'Suggest training examples' })
  @ApiResponse({ status: 200, description: 'Training examples suggested' })
  async suggestTraining(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const memory = await this.samService.findOne(id, userId);

    return this.trainingService.suggestTrainingExamples({
      title: memory.title,
      content: memory.content,
      canonicalPhrases: memory.canonicalPhrases
    });
  }

  @Post(':id/training/test')
  @ApiOperation({ summary: 'Test training examples' })
  @ApiResponse({ status: 200, description: 'Training test results' })
  async testTraining(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const memory = await this.samService.findOne(id, userId);

    return this.trainingService.runTrainingTests(memory.trainingExamples);
  }
}
