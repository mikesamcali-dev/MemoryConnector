import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WordsService } from './words.service';

@ApiTags('words')
@Controller('words')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WordsController {
  constructor(private wordsService: WordsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all words with counts' })
  async getAllWords() {
    return this.wordsService.getWordsWithCounts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get word by ID' })
  async getWord(@Param('id') id: string) {
    return this.wordsService.findById(id);
  }

  @Get('lookup/:word')
  @ApiOperation({ summary: 'Lookup word by text' })
  async lookupWord(@Param('word') word: string) {
    return this.wordsService.findByWord(word);
  }

  @Post('process-memory-phrase')
  @ApiOperation({
    summary: 'Process phrase/word linking for a memory',
    description: 'Automatically detects and links words/phrases (1-3 words) to a memory. Runs in background after memory creation.'
  })
  async processMemoryPhrase(
    @Body() body: { memoryId: string; text: string }
  ) {
    // Fire and forget - don't wait for completion
    this.wordsService.processMemoryPhraseLinking(body.memoryId, body.text)
      .catch(error => {
        console.error('[PHRASE LINKING] Background processing error:', error);
      });

    return { success: true, message: 'Phrase linking processing started' };
  }
}
