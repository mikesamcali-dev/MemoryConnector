import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionResponseDto } from './dto/question-response.dto';

@ApiTags('questions')
@Controller('questions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all questions for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns list of questions', type: [QuestionResponseDto] })
  async findAll(@User() user: any) {
    return this.questionsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID' })
  @ApiResponse({ status: 200, description: 'Returns question details', type: QuestionResponseDto })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findOne(@Param('id') id: string, @User() user: any) {
    return this.questionsService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a question and get answer from OpenAI' })
  @ApiResponse({ status: 201, description: 'Question created successfully', type: QuestionResponseDto })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async create(@Body() dto: CreateQuestionDto, @User() user: any) {
    return this.questionsService.create(user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async delete(@Param('id') id: string, @User() user: any) {
    return this.questionsService.delete(id, user.id);
  }
}
