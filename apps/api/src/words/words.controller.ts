import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
}
