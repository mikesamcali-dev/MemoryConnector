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
import { SlideDecksService } from './slidedecks.service';
import { CreateSlideDeckDto } from './dto/create-slidedeck.dto';
import { UpdateSlideDeckDto } from './dto/update-slidedeck.dto';
import { SlideDeckResponseDto, SlideResponseDto } from './dto/slidedeck-response.dto';

@ApiTags('slidedecks')
@Controller('slidedecks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SlideDecksController {
  constructor(private readonly slideDecksService: SlideDecksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all slide decks for user' })
  @ApiResponse({
    status: 200,
    description: 'List of slide decks',
    type: [SlideDeckResponseDto],
  })
  async findAll(@User() user: any) {
    return this.slideDecksService.findAll(user.id);
  }

  @Post('create-from-overdue')
  @ApiOperation({ summary: 'Create slide deck from overdue reminders' })
  @ApiResponse({
    status: 201,
    description: 'Slide deck created successfully',
    type: SlideDeckResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No overdue reminders found',
  })
  async createFromOverdue(
    @User() user: any,
    @Body() dto: CreateSlideDeckDto,
  ) {
    return this.slideDecksService.createFromOverdueReminders(user.id, dto);
  }

  @Post('create-from-selected')
  @ApiOperation({ summary: 'Create slide deck from selected reminder IDs' })
  @ApiResponse({
    status: 201,
    description: 'Slide deck created successfully',
    type: SlideDeckResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No reminders selected or found',
  })
  async createFromSelected(
    @User() user: any,
    @Body() dto: { reminderIds: string[]; title?: string },
  ) {
    return this.slideDecksService.createFromSelectedReminders(
      user.id,
      dto.reminderIds,
      dto.title,
    );
  }

  @Get('recent-reminders')
  @ApiOperation({ summary: 'Get all recent reminders for slidedeck selection' })
  @ApiResponse({
    status: 200,
    description: 'List of recent reminders',
  })
  async getRecentReminders(@User() user: any) {
    return this.slideDecksService.getAllRecentReminders(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific slide deck' })
  @ApiResponse({
    status: 200,
    description: 'Slide deck details',
    type: SlideDeckResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Slide deck not found',
  })
  async findOne(@Param('id') id: string, @User() user: any) {
    return this.slideDecksService.findOne(user.id, id);
  }

  @Get(':id/slides')
  @ApiOperation({ summary: 'Get slides for a deck with full memory data' })
  @ApiResponse({
    status: 200,
    description: 'List of slides with memory data',
    type: [SlideResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Slide deck not found',
  })
  async getSlides(@Param('id') id: string, @User() user: any) {
    return this.slideDecksService.getSlides(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a slide deck' })
  @ApiResponse({
    status: 200,
    description: 'Slide deck updated successfully',
    type: SlideDeckResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Slide deck not found',
  })
  async update(
    @Param('id') id: string,
    @User() user: any,
    @Body() dto: UpdateSlideDeckDto,
  ) {
    return this.slideDecksService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a slide deck' })
  @ApiResponse({
    status: 204,
    description: 'Slide deck deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Slide deck not found',
  })
  async delete(@Param('id') id: string, @User() user: any) {
    await this.slideDecksService.delete(user.id, id);
  }
}
