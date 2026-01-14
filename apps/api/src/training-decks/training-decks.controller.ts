import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { TrainingDecksService } from './training-decks.service';
import { CreateTrainingDeckDto } from './dto/create-training-deck.dto';
import { UpdateTrainingDeckDto } from './dto/update-training-deck.dto';

@ApiTags('training-decks')
@Controller('training-decks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TrainingDecksController {
  constructor(private readonly trainingDecksService: TrainingDecksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all training decks for user' })
  @ApiResponse({
    status: 200,
    description: 'List of training decks',
  })
  async findAll(@User() user: any) {
    return this.trainingDecksService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create training deck from a training' })
  @ApiResponse({
    status: 201,
    description: 'Training deck created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Training has no linked content',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  async create(
    @User() user: any,
    @Body() dto: CreateTrainingDeckDto,
  ) {
    return this.trainingDecksService.createFromTraining(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific training deck' })
  @ApiResponse({
    status: 200,
    description: 'Training deck details',
  })
  @ApiResponse({
    status: 404,
    description: 'Training deck not found',
  })
  async findOne(@Param('id') id: string, @User() user: any) {
    return this.trainingDecksService.findOne(user.id, id);
  }

  @Get(':id/lessons')
  @ApiOperation({ summary: 'Get lessons for a deck with full polymorphic data' })
  @ApiResponse({
    status: 200,
    description: 'List of lessons with content data',
  })
  @ApiResponse({
    status: 404,
    description: 'Training deck not found',
  })
  async getLessons(@Param('id') id: string, @User() user: any) {
    return this.trainingDecksService.getLessons(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a training deck' })
  @ApiResponse({
    status: 200,
    description: 'Training deck updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Training deck not found',
  })
  async update(
    @Param('id') id: string,
    @User() user: any,
    @Body() dto: UpdateTrainingDeckDto,
  ) {
    return this.trainingDecksService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a training deck' })
  @ApiResponse({
    status: 204,
    description: 'Training deck deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Training deck not found',
  })
  async delete(@Param('id') id: string, @User() user: any) {
    await this.trainingDecksService.delete(user.id, id);
  }

  @Delete(':id/lessons/:lessonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a specific training lesson from a deck' })
  @ApiResponse({
    status: 204,
    description: 'Training lesson deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Training deck or lesson not found',
  })
  async deleteLesson(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
    @User() user: any,
  ) {
    await this.trainingDecksService.deleteLesson(user.id, id, lessonId);
  }
}
