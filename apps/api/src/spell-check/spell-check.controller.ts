import { Controller, Get, Post, Delete, Query, Body, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SpellCheckService } from './spell-check.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@ApiTags('spell-check')
@Controller('spell-check')
@UseGuards(JwtAuthGuard)
export class SpellCheckController {
  constructor(private spellCheckService: SpellCheckService) {}

  @Get('suggestions')
  @ApiOperation({ summary: 'Get spelling suggestions for a word (from API and database)' })
  @ApiResponse({ status: 200, description: 'Returns spelling suggestions' })
  async getSuggestions(@Query('word') word: string, @User() user: any) {
    if (!word || word.trim().length === 0) {
      return { suggestions: [] };
    }

    const suggestions = await this.spellCheckService.getSuggestions(word.trim(), user.id);
    return { word, suggestions };
  }

  @Get('excluded-words')
  @ApiOperation({ summary: 'Get list of excluded words for the current user' })
  @ApiResponse({ status: 200, description: 'Returns list of excluded words' })
  async getExcludedWords(@User() user: any) {
    const words = await this.spellCheckService.getExcludedWords(user.id);
    return { excludedWords: words };
  }

  @Post('excluded-words')
  @ApiOperation({ summary: 'Add a word to excluded words list' })
  @ApiResponse({ status: 201, description: 'Word added to excluded list' })
  async addExcludedWord(@Body() body: { word: string }, @User() user: any) {
    if (!body.word || body.word.trim().length === 0) {
      return { success: false, message: 'Word is required' };
    }

    await this.spellCheckService.addExcludedWord(user.id, body.word.trim());
    return { success: true, word: body.word.trim() };
  }

  @Delete('excluded-words')
  @ApiOperation({ summary: 'Remove a word from excluded words list' })
  @ApiResponse({ status: 200, description: 'Word removed from excluded list' })
  async removeExcludedWord(@Query('word') word: string, @User() user: any) {
    if (!word || word.trim().length === 0) {
      return { success: false, message: 'Word is required' };
    }

    await this.spellCheckService.removeExcludedWord(user.id, word.trim());
    return { success: true, word: word.trim() };
  }
}
