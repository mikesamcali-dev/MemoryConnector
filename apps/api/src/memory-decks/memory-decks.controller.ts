import {
  Controller,
  Get,
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
import { MemoryDecksService } from './memory-decks.service';
import { UpdateMemoryDeckDto } from './dto/update-memory-deck.dto';
import { MemoryDeckResponseDto, MemoryDeckItemResponseDto } from './dto/memory-deck-response.dto';

@ApiTags('memory-decks')
@Controller('memory-decks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MemoryDecksController {
  constructor(private readonly memoryDecksService: MemoryDecksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all memory decks for user' })
  @ApiResponse({
    status: 200,
    description: 'List of memory decks',
    type: [MemoryDeckResponseDto],
  })
  async getAllDecks(@User() user: any) {
    return this.memoryDecksService.getAllDecks(user.id);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current (non-archived) memory deck' })
  @ApiResponse({
    status: 200,
    description: 'Current memory deck',
    type: MemoryDeckResponseDto,
  })
  async getCurrentDeck(@User() user: any) {
    return this.memoryDecksService.getCurrentDeck(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific memory deck' })
  @ApiResponse({
    status: 200,
    description: 'Memory deck details',
    type: MemoryDeckResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Memory deck not found',
  })
  async getDeck(@Param('id') id: string, @User() user: any) {
    return this.memoryDecksService.getDeck(user.id, id);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'Get items for a deck with full memory data' })
  @ApiResponse({
    status: 200,
    description: 'List of items with memory data',
    type: [MemoryDeckItemResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Memory deck not found',
  })
  async getDeckItems(@Param('id') id: string, @User() user: any) {
    return this.memoryDecksService.getDeckItems(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a memory deck' })
  @ApiResponse({
    status: 200,
    description: 'Memory deck updated successfully',
    type: MemoryDeckResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Memory deck not found',
  })
  async updateDeck(
    @Param('id') id: string,
    @User() user: any,
    @Body() dto: UpdateMemoryDeckDto,
  ) {
    return this.memoryDecksService.updateDeck(user.id, id, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a memory deck' })
  @ApiResponse({
    status: 200,
    description: 'Memory deck archived successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Memory deck not found',
  })
  async archiveDeck(@Param('id') id: string, @User() user: any) {
    await this.memoryDecksService.archiveDeck(user.id, id);
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a memory deck' })
  @ApiResponse({
    status: 204,
    description: 'Memory deck deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Memory deck not found',
  })
  async deleteDeck(@Param('id') id: string, @User() user: any) {
    await this.memoryDecksService.deleteDeck(user.id, id);
  }
}
